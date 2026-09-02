"""
Unit and Integration Tests for Social Media URL Classification, Prioritization,
and Canonical Blockchain Record Provenance in FaceTrace Ledger.
"""

import pytest
from src.search.result_parser import classify_url, parse_search_results, extract_domain
from src.search.candidate_verifier import get_candidate_priority, RESULT_TYPE_PRIORITY
from src.record.metadata_builder import build_verification_record
from src.crypto.hashing import hash_record
from src.blockchain.client import BlockchainClient
from src.blockchain.uploader import BlockchainUploader
from src.blockchain.verifier import BlockchainVerifier


class TestSocialMediaClassification:
    def test_instagram_post(self):
        url = "https://www.instagram.com/p/C123456789/"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "instagram"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_instagram_reel(self):
        url = "https://instagram.com/reel/C987654321/"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "instagram"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_instagram_profile(self):
        url = "https://www.instagram.com/johndoe_official/"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "instagram"
        assert res["result_type"] == "SOCIAL_MEDIA_PROFILE"

    def test_x_twitter_post(self):
        url = "https://x.com/elonmusk/status/1789012345678901234"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "x"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_x_twitter_profile(self):
        url = "https://twitter.com/example_user"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "x"
        assert res["result_type"] == "SOCIAL_MEDIA_PROFILE"

    def test_reddit_post(self):
        url = "https://www.reddit.com/r/technology/comments/1abc234/new_ai_breakthrough/"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "reddit"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_reddit_user(self):
        url = "https://reddit.com/user/ai_researcher_2026/"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "reddit"
        assert res["result_type"] == "SOCIAL_MEDIA_PROFILE"

    def test_reddit_subreddit_page(self):
        url = "https://www.reddit.com/r/MachineLearning/"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "reddit"
        assert res["result_type"] == "SOCIAL_MEDIA_PAGE"

    def test_tiktok_video(self):
        url = "https://www.tiktok.com/@creative_artist/video/7123456789012345678"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "tiktok"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_tiktok_profile(self):
        url = "https://www.tiktok.com/@creative_artist"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "tiktok"
        assert res["result_type"] == "SOCIAL_MEDIA_PROFILE"

    def test_pinterest_pin(self):
        url = "https://www.pinterest.com/pin/123456789012345678/"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "pinterest"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_linkedin_post(self):
        url = "https://www.linkedin.com/posts/example_tech-trends-2026-activity-123456789"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "linkedin"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_linkedin_profile(self):
        url = "https://www.linkedin.com/in/satyanadella/"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "linkedin"
        assert res["result_type"] == "SOCIAL_MEDIA_PROFILE"

    def test_facebook_post(self):
        url = "https://www.facebook.com/permalink.php?story_fbid=12345&id=67890"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "facebook"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_threads_post(self):
        url = "https://www.threads.net/@zuck/post/Cx1234567"
        res = classify_url(url)
        assert res["is_social_media"] is True
        assert res["social_platform"] == "threads"
        assert res["result_type"] == "SOCIAL_MEDIA_POST"

    def test_general_website(self):
        url = "https://en.wikipedia.org/wiki/Face_detection"
        res = classify_url(url)
        assert res["is_social_media"] is False
        assert res["social_platform"] is None
        assert res["result_type"] == "GENERAL_WEB_RESULT"

    def test_malformed_urls_safe_fallback(self):
        assert classify_url(None)["result_type"] == "GENERAL_WEB_RESULT"
        assert classify_url("")["result_type"] == "GENERAL_WEB_RESULT"
        assert classify_url("not_a_valid_url")["result_type"] == "GENERAL_WEB_RESULT"
        assert classify_url("ftp://example.com/file")["result_type"] == "GENERAL_WEB_RESULT"


class TestCandidatePrioritization:
    def test_priority_order(self):
        candidates = [
            {"url": "https://example.com/article", "result_type": "GENERAL_WEB_RESULT", "title": "News"},
            {"url": "https://reddit.com/r/test", "result_type": "SOCIAL_MEDIA_PAGE", "title": "Subreddit"},
            {"url": "https://instagram.com/user", "result_type": "SOCIAL_MEDIA_PROFILE", "title": "Profile"},
            {"url": "https://reddit.com/r/test/comments/123/post", "result_type": "SOCIAL_MEDIA_POST", "title": "Post"},
        ]

        prioritized = sorted(candidates, key=get_candidate_priority)
        assert prioritized[0]["result_type"] == "SOCIAL_MEDIA_POST"
        assert prioritized[1]["result_type"] == "SOCIAL_MEDIA_PROFILE"
        assert prioritized[2]["result_type"] == "SOCIAL_MEDIA_PAGE"
        assert prioritized[3]["result_type"] == "GENERAL_WEB_RESULT"


class TestBlockchainRecordSocialProvenance:
    def test_record_hash_includes_social_fields(self):
        img_hash = "a" * 64
        rec1 = build_verification_record(
            source_url="https://reddit.com/r/pics/comments/abc/portrait",
            source_domain="reddit.com",
            result_title="Sample Post",
            image_sha256=img_hash,
            similarity_score=0.92,
            search_provider="serpapi_lens",
            result_type="SOCIAL_MEDIA_POST",
            is_social_media=True,
            social_platform="reddit"
        )
        h1 = hash_record(rec1)["hash"]

        # Alter social_platform
        rec2 = dict(rec1)
        rec2["social_platform"] = "instagram"
        h2 = hash_record(rec2)["hash"]
        assert h1 != h2

        # Alter result_type
        rec3 = dict(rec1)
        rec3["result_type"] = "GENERAL_WEB_RESULT"
        h3 = hash_record(rec3)["hash"]
        assert h1 != h3

    def test_onchain_verification_with_social_metadata(self):
        img_hash = "b" * 64
        record = build_verification_record(
            source_url="https://www.instagram.com/p/test_sample_123/",
            source_domain="instagram.com",
            result_title="Instagram Verified Post",
            image_sha256=img_hash,
            similarity_score=0.885,
            search_provider="serpapi_lens",
            result_type="SOCIAL_MEDIA_POST",
            is_social_media=True,
            social_platform="instagram"
        )
        rec_hash = hash_record(record)["hash"]

        client = BlockchainClient()
        contract = client.ensure_contract_deployed()
        uploader = BlockchainUploader(client, contract)
        upload_res = uploader.upload_record_hash(rec_hash)
        assert upload_res["transaction_hash"] is not None

        verifier = BlockchainVerifier(client, contract)
        check_valid = verifier.verify_discovered_record(record)
        assert check_valid["verified"] is True

        # Tampered record with altered social platform
        tampered = dict(record)
        tampered["social_platform"] = "x"
        check_tampered = verifier.verify_discovered_record(tampered)
        assert check_tampered["verified"] is False
