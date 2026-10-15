import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_omni_ai_pdf_and_action_buttons():
    res = client.post("/api/ai/chat", json={"message": "How do I merge PDFs?"})
    assert res.status_code == 200
    data = res.json()
    assert "Merge" in data["reply"]
    assert "[ACTION:OPEN_MERGE" in data["reply"]
    assert data["provider"] == "builtin"

def test_omni_ai_video_advice():
    res = client.post("/api/ai/chat", json={"message": "How to compress video for Discord upload under 25MB?"})
    assert res.status_code == 200
    data = res.json()
    assert "Discord" in data["reply"]
    assert "[ACTION:OPEN_CONVERTER" in data["reply"]

def test_omni_ai_python_script_guidance():
    res = client.post("/api/ai/chat", json={"message": "Write a python script to batch convert images"})
    assert res.status_code == 200
    data = res.json()
    assert "```python" in data["reply"]
    assert "Pillow" in data["reply"] or "Image" in data["reply"]

def test_omni_ai_regex_guidance():
    res = client.post("/api/ai/chat", json={"message": "What is the regex pattern for email?"})
    assert res.status_code == 200
    data = res.json()
    assert "Email" in data["reply"]
    assert "@" in data["reply"]

def test_omni_ai_unit_guidance():
    res = client.post("/api/ai/chat", json={"message": "Calculate video bitrate formula and storage units"})
    assert res.status_code == 200
    data = res.json()
    assert "Bitrate" in data["reply"] or "Storage" in data["reply"]
    assert "[ACTION:OPEN_UNITS" in data["reply"]
