import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import fetch_posts


class NormalizeTokenTests(unittest.TestCase):
    def test_normalizes_common_secret_wrappers(self):
        cases = {
            "  abc123\n": "abc123",
            '"abc123"': "abc123",
            "'abc123'": "abc123",
            "Bearer abc123": "abc123",
            "INSTAGRAM_ACCESS_TOKEN=abc123": "abc123",
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(fetch_posts.normalize_token(raw), expected)


class InstagramAPITests(unittest.TestCase):
    @patch("fetch_posts.requests.get")
    def test_fetches_account_then_current_media_endpoint(self, mock_get):
        account_response = Mock(ok=True)
        account_response.json.return_value = {
            "user_id": "17841400000000000",
            "username": "ghettymotorhome",
        }
        media_response = Mock(ok=True)
        media_response.json.return_value = {
            "data": [
                {
                    "id": "1",
                    "caption": "Road trip",
                    "media_type": "IMAGE",
                    "media_url": "https://cdn.example/post.jpg",
                    "permalink": "https://www.instagram.com/p/example/",
                    "timestamp": "2026-07-12T00:00:00+0000",
                }
            ]
        }
        mock_get.side_effect = [account_response, media_response]

        posts, username = fetch_posts.fetch_posts("secret-token")

        self.assertEqual(username, "ghettymotorhome")
        self.assertEqual(len(posts), 1)
        first_url = mock_get.call_args_list[0].args[0]
        second_url = mock_get.call_args_list[1].args[0]
        self.assertTrue(first_url.endswith("/v25.0/me"))
        self.assertTrue(second_url.endswith("/v25.0/17841400000000000/media"))
        self.assertEqual(
            mock_get.call_args_list[1].kwargs["params"]["limit"],
            fetch_posts.LIMIT,
        )

    @patch("fetch_posts.requests.get")
    def test_fetches_facebook_connected_instagram_account(self, mock_get):
        pages_response = Mock(ok=True)
        pages_response.json.return_value = {
            "data": [
                {
                    "id": "page-1",
                    "access_token": "page-token",
                    "instagram_business_account": {
                        "id": "17841400000000000",
                        "username": "ghettymotorhome",
                    },
                }
            ]
        }
        media_response = Mock(ok=True)
        media_response.json.return_value = {
            "data": [
                {
                    "id": "1",
                    "media_type": "IMAGE",
                    "media_url": "https://cdn.example/post.jpg",
                    "permalink": "https://www.instagram.com/p/example/",
                }
            ]
        }
        mock_get.side_effect = [pages_response, media_response]

        posts, username = fetch_posts.fetch_posts("EAA-facebook-user-token")

        self.assertEqual(username, "ghettymotorhome")
        self.assertEqual(len(posts), 1)
        self.assertIn("graph.facebook.com", mock_get.call_args_list[0].args[0])
        self.assertTrue(mock_get.call_args_list[0].args[0].endswith("/v25.0/me/accounts"))
        self.assertTrue(
            mock_get.call_args_list[1].args[0].endswith(
                "/v25.0/17841400000000000/media"
            )
        )
        self.assertEqual(
            mock_get.call_args_list[1].kwargs["params"]["access_token"],
            "page-token",
        )

    @patch("fetch_posts.requests.get")
    def test_api_error_does_not_leak_token_or_request_url(self, mock_get):
        response = Mock(ok=False, status_code=400)
        response.json.return_value = {
            "error": {
                "message": "Invalid OAuth access token - Cannot parse access token",
                "type": "OAuthException",
                "code": 190,
            }
        }
        mock_get.return_value = response

        with self.assertRaises(fetch_posts.InstagramAPIError) as context:
            fetch_posts.get_account("top-secret-token")

        message = str(context.exception)
        self.assertNotIn("top-secret-token", message)
        self.assertNotIn("access_token=", message)
        self.assertIn("code=190", message)

    def test_atomic_writer_outputs_real_feed(self):
        post = {
            "id": "1",
            "media_type": "IMAGE",
            "media_url": "https://cdn.example/post.jpg",
            "permalink": "https://www.instagram.com/p/example/",
        }
        with tempfile.TemporaryDirectory() as directory:
            old_output = fetch_posts.OUTPUT_FILE
            fetch_posts.OUTPUT_FILE = Path(directory) / "posts.json"
            try:
                fetch_posts.write_posts([post], "ghettymotorhome")
                payload = json.loads(fetch_posts.OUTPUT_FILE.read_text())
            finally:
                fetch_posts.OUTPUT_FILE = old_output

        self.assertEqual(payload["source"], "instagram_graph_api")
        self.assertEqual(payload["username"], "ghettymotorhome")
        self.assertEqual(payload["posts"], [post])


if __name__ == "__main__":
    unittest.main()
