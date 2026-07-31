import secrets
import json
from flask import Flask, render_template, request, jsonify

USE_TOKEN = True

app = Flask(__name__)

tokens = []

scores: json

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/api/login", methods=["POST"])
def api_login():
    username = request.form.get('username')
    password = request.form.get('password')

    with open("data/user.json", "r") as file:
        user = json.load(file)
        if username == user["username"]:
            if password == user["password"]:
                return jsonify({
                        "status": 1,
                        "msg": "success",
                        "token": gen_token()
                    })

            jsonify({
                "status": 0,
                "msg": "uncorrect password"
            })

        return jsonify({
            "status": 0,
            "msg": "unknow user"
        })

@app.route("/api/logout", methods=["POST"])
def logout():
    token = request.form.get("token")

    if token == None:
        return jsonify({
            "status": 0,
            "msg": "no token in json"
        })

    if token in tokens:
        return  jsonify({
            "status": 1,
            "msg": "success"
        })

    return jsonify({
        "status": 0,
        "msg": "token uncorrect"
    })



@app.route("/api/GetScore", methods=["GET"])
def get_score():
    return json.dumps(scores)

@app.route("/api/AddScore", methods=["POST"])
def add_score():
    limit: json
    try:
        limit = request.get_json()
    except:
        return jsonify({
                "status": 0,
                "msg": "json decode error when add score"
            })

    if USE_TOKEN:
        try:
            if limit["token"] not in tokens:
                return jsonify({
                    "status": 0,
                    "msg": "please login"
                })
        except Exception as e:
            return jsonify({
                "status": 0,
                "msg": "no token in json"
            })

    if type(limit["group"]) != int:
        return jsonify({
            "status": 0,
            "msg": "unaccept group value"
        })
    
    if limit["group"] < 0 or 6 < limit["group"]:
        return jsonify({
            "status": 0,
            "msg": "unaccept group value"
        })

    score = 0

    try:
        if limit["year"] == True:
            score = score + 1
        if limit["name"] == True:
            score = score + 1
        if limit["SD"] == True:
            score = score + 1
    except Exception as e:
        return jsonify({
            "status": 0,
            "msg": "error when getting limit value"
        })

    try:
        scores[str(limit["group"])] = scores[str(limit["group"])] + score

        with open("data/score.json", 'w') as file:
            json.dump(scores, file, indent=4)

    except Exception as e:
        return jsonify({
            "status": 0,
            "msg": f"error when change score.json: {e} \n score data: {scores}"
        })

    return jsonify({
            "status": 1,
            "msg": "success"
        })


@app.route("/api/SetScore", methods=["POST"])
def set_score():
    json_data: json
    try:
        json_data = request.get_json()
    except:
        return jsonify({
                "status": 0,
                "msg": "json decode error when add score"
            })

    print("jsondecode")

    group: int
    score: int
    
    try:
        group = json_data["group"]
        score = json_data["score"]
    except Exception as e:
        return jsonify({
            "status": 0,
            "msg": "unaccept value in json when set score"
        })

    if type(group) != int:
        return jsonify({
            "status": 0,
            "msg": "unaccept group value"
        })

    if type(score) != int:
        return jsonify({
            "status": 0,
            "msg": "unaccept score value"
        })

    if group < 1 or 6 < group:
        return jsonify({
            "status": 0,
            "msg": "unaccept group value"
        })

    try:
        scores[str(group)] = score

        with open("data/score.json", 'w') as file:
            json.dump(scores, file, indent=4)

    except Exception as e:
        return jsonify({
            "status": 0,
            "msg": f"error when change score.json: {e} \n score data: {scores}"
        })

    print("write out")

    return jsonify({
            "status": "success",
            "msg": "success"
        })

def gen_token():
    token = secrets.token_urlsafe(32)

    tokens.append(token)

    return token

if __name__ == "__main__":
    with open("data/score.json", 'r', encoding='utf-8') as file:
        scores = json.load(file)

    app.run(host="127.0.0.1", port=5000, debug=True)
