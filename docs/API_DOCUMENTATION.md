# API Documentation

## Base URL
```
http://localhost:5001/api
```

---

## Authentication

### Token-Based Authentication
Requests that require authentication should include the token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

Or in the request body:
```json
{
  "token": "YOUR_TOKEN_HERE"
}
```

---

## Endpoints

### 1. **Vote Submission**

#### Submit a Vote
```
POST /votes
```

**Headers:**
```
Authorization: Bearer {voterToken}
Content-Type: application/json
```

**Body:**
```json
{
  "surveyId": "uuid",
  "candidateId": "uuid",
  "strengthIds": ["id1", "id2"],
  "weaknessIds": ["id3", "id4"],
  "feedbackText": "Optional written feedback"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Vote submitted successfully",
  "voteId": "uuid"
}
```

**Errors:**
- `400`: Missing required fields
- `403`: Token has already voted
- `404`: Survey not found or candidate not found
- `500`: Internal server error

---

#### Check Vote Status
```
POST /votes/status
```

**Body:**
```json
{
  "surveyId": "uuid",
  "token": "voter_token"
}
```

**Response:**
```json
{
  "hasVoted": false,
  "message": "Token can vote"
}
```

---

### 2. **Results Endpoints**

#### Get Candidate Results
```
GET /votes/results/{surveyId}
```

**Headers:**
```
Authorization: Bearer {candidateToken}
```

**Response:**
```json
{
  "candidateId": "uuid",
  "surveyId": "uuid",
  "totalVotes": 15,
  "summary": {
    "strengths": [
      {
        "id": "str1",
        "text": "Great communication",
        "count": 10
      }
    ],
    "weaknesses": [
      {
        "id": "weak1",
        "text": "Time management",
        "count": 5
      }
    ]
  },
  "rawVotes": []
}
```

**Errors:**
- `401`: Invalid token
- `404`: Candidate not found
- `500`: Internal server error

---

### 3. **Survey Management (Admin)**

#### Create Survey
```
POST /admin/surveys
```

**Headers:**
```
Authorization: Bearer {adminToken}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Q4 360 Degree Feedback",
  "description": "Optional description"
}
```

**Response (201):**
```json
{
  "success": true,
  "survey": {
    "id": "uuid",
    "title": "Q4 360 Degree Feedback",
    "description": "Optional description",
    "status": "draft",
    "created_by": "admin_id",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### Get All Surveys
```
GET /admin/surveys
```

**Headers:**
```
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "surveys": [
    {
      "id": "uuid",
      "title": "Q4 360 Degree Feedback",
      "description": "...",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "candidate_count": 5,
      "vote_count": 23
    }
  ]
}
```

---

#### Get Survey Details
```
GET /admin/surveys/{surveyId}
```

**Headers:**
```
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "survey": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "status": "active",
    "created_by": "...",
    "created_at": "..."
  },
  "candidates": [
    {
      "id": "uuid",
      "name": "John Doe",
      "employee_id": "123",
      "department": "Engineering"
    }
  ],
  "feedbackOptions": {
    "strengths": [
      {
        "id": "uuid",
        "option_text": "Great communication",
        "display_order": 1
      }
    ],
    "weaknesses": [...]
  }
}
```

---

#### Update Survey Status
```
PATCH /admin/surveys/{surveyId}
```

**Headers:**
```
Authorization: Bearer {adminToken}
```

**Body:**
```json
{
  "status": "active"
}
```

**Valid statuses:** `draft`, `active`, `closed`

**Response:**
```json
{
  "success": true,
  "survey": {
    "id": "uuid",
    "status": "active",
    ...
  }
}
```

---

#### Add Candidate
```
POST /admin/surveys/{surveyId}/candidates
```

**Headers:**
```
Authorization: Bearer {adminToken}
```

**Body:**
```json
{
  "name": "John Doe",
  "employeeId": "123",
  "department": "Engineering"
}
```

**Response (201):**
```json
{
  "success": true,
  "candidate": {
    "id": "uuid",
    "name": "John Doe",
    "employee_id": "123",
    "department": "Engineering"
  },
  "accessToken": "random_token_123abc..."
}
```

**Important:** The `accessToken` is sent once. Store it securely for the candidate. Once the request completes, the token cannot be retrieved again (it's hashed in the database).

---

#### Add Feedback Option
```
POST /admin/surveys/{surveyId}/feedback-options
```

**Headers:**
```
Authorization: Bearer {adminToken}
```

**Body:**
```json
{
  "type": "strength",
  "optionText": "Great communication skills",
  "displayOrder": 1
}
```

**Valid types:** `strength`, `weakness`

**Response (201):**
```json
{
  "success": true,
  "feedbackOption": {
    "id": "uuid",
    "type": "strength",
    "option_text": "Great communication skills",
    "display_order": 1
  }
}
```

---

#### Get All Results
```
GET /admin/surveys/{surveyId}/all-results
```

**Headers:**
```
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "surveyId": "uuid",
  "results": [
    {
      "candidate_id": "uuid",
      "candidate_name": "John Doe",
      "total_votes": 15,
      "strength_ids": ["str1", "str2"],
      "weakness_ids": ["weak1"]
    }
  ],
  "feedbackOptions": {
    "str1": {
      "text": "Great communication",
      "type": "strength"
    }
  }
}
```

---

## Example Workflows

### Voting Workflow

```javascript
// 1. Check if token can vote
POST /votes/status
{
  "surveyId": "survey-1",
  "token": "voter_token_123"
}

// Response: { "hasVoted": false, "message": "Token can vote" }

// 2. Submit vote
POST /votes
Headers: { Authorization: "Bearer voter_token_123" }
{
  "surveyId": "survey-1",
  "candidateId": "cand-1",
  "strengthIds": ["str1", "str2"],
  "weaknessIds": ["weak1"],
  "feedbackText": "Great colleague"
}

// Response: { "success": true, "voteId": "vote-uuid" }
```

### Results Workflow

```javascript
// Get candidate results
GET /votes/results/survey-1
Headers: { Authorization: "Bearer candidate_access_token_456" }

// Response: 
{
  "candidateId": "cand-1",
  "surveyId": "survey-1",
  "totalVotes": 15,
  "summary": {
    "strengths": [
      { "id": "str1", "text": "Great communication", "count": 10 },
      { "id": "str2", "text": "Strong problem-solving", "count": 8 }
    ],
    "weaknesses": [
      { "id": "weak1", "text": "Time management", "count": 5 }
    ]
  }
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider adding:
- Rate limiting per IP
- Rate limiting per token
- Rate limiting per endpoint

---

## Error Handling

All errors return appropriate HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "error": "Description of what went wrong"
}
```

---

## Security Notes

1. **Tokens are hashed:** All tokens are hashed before comparison
2. **No voter identification:** Votes never contain voter token info
3. **HTTPS Required:** In production, always use HTTPS
4. **CORS Configured:** CORS is limited to configured origins
5. **Input Validation:** All inputs are validated on the backend

---

## Testing the API

### Using cURL

```bash
# Submit a vote
curl -X POST http://localhost:5001/api/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer voter_token_123" \
  -d '{
    "surveyId": "survey-1",
    "candidateId": "cand-1",
    "strengthIds": ["str1"],
    "weaknessIds": ["weak1"]
  }'

# Check vote status
curl -X POST http://localhost:5001/api/votes/status \
  -H "Content-Type: application/json" \
  -d '{
    "surveyId": "survey-1",
    "token": "voter_token_123"
  }'

# Get candidate results
curl -X GET http://localhost:5001/api/votes/results/survey-1 \
  -H "Authorization: Bearer candidate_token_456"
```

### Using JavaScript (Fetch API)

```javascript
// Submit vote
const response = await fetch('http://localhost:5001/api/votes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer voter_token_123'
  },
  body: JSON.stringify({
    surveyId: 'survey-1',
    candidateId: 'cand-1',
    strengthIds: ['str1'],
    weaknessIds: ['weak1']
  })
});

const data = await response.json();
```

---

**Version:** 1.0.0  
**Last Updated:** December 2024
