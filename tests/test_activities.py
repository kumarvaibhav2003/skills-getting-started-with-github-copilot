from fastapi.testclient import TestClient
import sys
import os

# Ensure src package is importable
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.app import app


client = TestClient(app)


def test_get_activities_contains_expected_keys():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    # check a few known activities exist
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_and_unregister_flow():
    activity = "Tennis Club"
    email = "test_student@example.com"

    # Ensure not already registered
    r0 = client.get("/activities")
    participants = r0.json()[activity]["participants"]
    if email in participants:
        # remove first if present to start from clean state
        client.post(f"/activities/{activity}/unregister?email={email}")

    # Sign up
    r1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r1.status_code == 200
    assert "Signed up" in r1.json().get("message", "")

    # Confirm present
    r2 = client.get("/activities")
    assert email in r2.json()[activity]["participants"]

    # Unregister
    r3 = client.post(f"/activities/{activity}/unregister?email={email}")
    assert r3.status_code == 200
    assert "Unregistered" in r3.json().get("message", "")

    # Confirm removed
    r4 = client.get("/activities")
    assert email not in r4.json()[activity]["participants"]
