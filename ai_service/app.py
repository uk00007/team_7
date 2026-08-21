from fastapi import FastAPI

from pydantic import BaseModel

from typing import List, Optional

import xgboost as xgb

import pandas as pd

import json



app = FastAPI(title="Katalyst AI Coach Recommender")



# Global variables to hold model and features

model = None

feature_names = []



TYPE_RANK = {

    'TRAINING': 0,

    'COURSE': 1,

    'MENTORING': 2,

    'PROJECT': 3,

    'ASSIGNMENT': 4,

    'QUIZ': 5,

    'PUZZLE': 6,

    'CERTIFICATE': 7,

    'MILESTONE': 8,

}



# ---------------------------------------------------------

# PYDANTIC SCHEMAS (Match the real shared Katalyst DB contract)

# ---------------------------------------------------------

class StudentProfile(BaseModel):

    userId: str

    totalXP: int = 0

    currentLevel: int = 1

    currentStreak: int = 0

    longestStreak: int = 0

    average_score: float = 0.0

    team_member_count: int = 0

    team_total_xp: int = 0

    team_contribution_ratio: float = 0.0



class ActivityItem(BaseModel):

    id: str

    title: str

    type: str

    category: str = 'GENERAL'

    isMandatory: bool = False

    isTeamBased: bool = False

    maxXP: int = 0

    dueDate: Optional[str] = None

    certificateRequired: bool = False

    status: str = 'PUBLISHED'



class RecommendationRequest(BaseModel):

    student: StudentProfile

    available_activities: List[ActivityItem]



# ---------------------------------------------------------

# STARTUP EVENT: Load the Model

# ---------------------------------------------------------

@app.on_event("startup")

async def load_model():

    global model, feature_names

    try:

        model = xgb.XGBClassifier()

        model.load_model("xgb_model.json")



        with open("feature_names.json", "r") as f:

            feature_names = json.load(f)

        print("XGBoost Model and feature names loaded successfully!")

    except Exception as e:

        print(f"Error loading model: {e}. Did you run train_model.py first?")





def _rule_based_score(student: StudentProfile, activity: ActivityItem) -> float:

    mandatory_boost = 0.35 if activity.isMandatory else 0.0

    team_boost = 0.1 if activity.isTeamBased else 0.0

    certificate_boost = 0.08 if activity.certificateRequired else 0.0

    xp_boost = min(0.2, max(activity.maxXP, 0) / 1000)

    streak_boost = min(0.12, student.currentStreak / 50)

    xp_progress_boost = min(0.15, student.totalXP / 5000)



    score = mandatory_boost + team_boost + certificate_boost + xp_boost + streak_boost + xp_progress_boost

    return min(score, 1.0)



# ---------------------------------------------------------

# API ENDPOINT

# ---------------------------------------------------------

@app.post("/api/coach/recommend")

async def get_recommendations(req: RecommendationRequest):

    if not req.available_activities:

        return {

            "success": True,

            "message": "No activities available to recommend.",

            "data": {"recommendations": []}

        }



    mandatory_activities = [act for act in req.available_activities if act.isMandatory]

    if mandatory_activities:

        return {

            "success": True,

            "message": "Prioritizing mandatory activities based on platform rules.",

            "data": {

                "recommendations": [

                    {

                        "activityId": act.id,

                        "title": act.title,

                        "reason": "Mandatory requirement",

                        "ai_confidence_score": 1.0

                    } for act in mandatory_activities[:3]

                ]

            }

        }



    recommendations = []



    for activity in req.available_activities:

        feature_dict = {

            'totalXP': req.student.totalXP,

            'currentLevel': req.student.currentLevel,

            'currentStreak': req.student.currentStreak,

            'longestStreak': req.student.longestStreak,

            'average_score': req.student.average_score,

            'team_member_count': req.student.team_member_count,

            'team_total_xp': req.student.team_total_xp,

            'team_contribution_ratio': req.student.team_contribution_ratio,

            'activity_is_mandatory': 1 if activity.isMandatory else 0,

            'activity_is_team_based': 1 if activity.isTeamBased else 0,

            'activity_has_certificate': 1 if activity.certificateRequired else 0,

            'activity_max_xp': activity.maxXP,

            'activity_type_rank': TYPE_RANK.get(activity.type, 0),

        }



        if model is not None and feature_names:

            df_features = pd.DataFrame([feature_dict])[feature_names]

            probability = float(model.predict_proba(df_features)[0][1])

            score = probability

            reason = "Recommended based on recent learning progress and activity fit."

        else:

            score = _rule_based_score(req.student, activity)

            reason = "Rule-based recommendation fallback."



        recommendations.append({

            "activityId": activity.id,

            "title": activity.title,

            "reason": reason,

            "ai_confidence_score": float(min(max(score, 0.0), 1.0))

        })



    recommendations.sort(key=lambda x: x["ai_confidence_score"], reverse=True)



    return {

        "success": True,

        "message": "AI recommendations generated successfully",

        "data": {

            "recommendations": recommendations[:3]

        }

    }






