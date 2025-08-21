from app import db
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    progress = db.relationship('Progress', backref='user', lazy=True)
    achievements = db.relationship('Achievement', backref='user', lazy=True)

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(100), default="Lesson")
    difficulty = db.Column(db.String(20), default="beginner")
    focus_keys = db.Column(db.String(100))  # Keys this lesson focuses on

class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    wpm = db.Column(db.Float, default=0.0)
    accuracy = db.Column(db.Float, default=0.0)
    time_taken = db.Column(db.Integer, default=0)  # in seconds
    error_count = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Composite unique constraint to prevent duplicate progress records
    __table_args__ = (db.UniqueConstraint('user_id', 'lesson_id', name='user_lesson_progress'),)

class Achievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    icon = db.Column(db.String(50), default="🏆")
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
