import numpy as np

import pandas as pd

import xgboost as xgb

from sklearn.model_selection import train_test_split

import json





def generate_mock_data(num_samples=1200):

    """Generate synthetic data based on the actual Katalyst project schema."""

    np.random.seed(42)



    type_rank_map = {

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



    data = {

        'totalXP': np.random.randint(0, 6000, num_samples),

        'currentLevel': np.random.randint(1, 10, num_samples),

        'currentStreak': np.random.randint(0, 45, num_samples),

        'longestStreak': np.random.randint(0, 90, num_samples),

        'average_score': np.random.uniform(30, 100, num_samples),

        'team_member_count': np.random.randint(1, 8, num_samples),

        'team_total_xp': np.random.randint(500, 25000, num_samples),

        'team_contribution_ratio': np.random.uniform(0, 1, num_samples),

        'activity_is_mandatory': np.random.randint(0, 2, num_samples),

        'activity_is_team_based': np.random.randint(0, 2, num_samples),

        'activity_has_certificate': np.random.randint(0, 2, num_samples),

        'activity_max_xp': np.random.randint(50, 500, num_samples),

        'activity_type_rank': np.random.choice(list(type_rank_map.values()), size=num_samples),

    }



    df = pd.DataFrame(data)



    logic_score = (

        (df['totalXP'] / 6000) * 0.18 +

        (df['currentLevel'] / 10) * 0.10 +

        (df['currentStreak'] / 45) * 0.12 +

        (df['longestStreak'] / 90) * 0.10 +

        (df['average_score'] / 100) * 0.18 +

        df['team_contribution_ratio'] * 0.08 +

        df['activity_is_mandatory'] * 0.18 +

        df['activity_is_team_based'] * 0.06 +

        df['activity_has_certificate'] * 0.06 +

        (df['activity_max_xp'] / 500) * 0.06 +

        (df['activity_type_rank'] / 8) * 0.08

    )



    df['successful_completion'] = (logic_score + np.random.uniform(-0.08, 0.08, num_samples) > 0.5).astype(int)

    return df





def train_and_export():

    print("Generating mock dataset based on the project schema...")

    df = generate_mock_data()



    X = df.drop('successful_completion', axis=1)

    y = df['successful_completion']



    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)



    print("Training XGBoost Classifier...")

    model = xgb.XGBClassifier(

        objective='binary:logistic',

        n_estimators=200,

        learning_rate=0.08,

        max_depth=4,

        random_state=42,

    )



    model.fit(X_train, y_train)



    accuracy = model.score(X_test, y_test)

    print(f"Model trained! Test Accuracy: {accuracy:.2f}")



    model.save_model('xgb_model.json')

    print("Model saved to xgb_model.json")



    with open('feature_names.json', 'w') as f:

        json.dump(list(X.columns), f)





if __name__ == "__main__":

    train_and_export() 

