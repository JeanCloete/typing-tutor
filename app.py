import os
import logging
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash, check_password_hash

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "you-should-change-this-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///database.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the app with the extension
db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Import models after db initialization
from models import User, Lesson, Progress, Achievement

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize DB and lessons once at startup
with app.app_context():
    db.create_all()
    
    # Create lessons if they don't exist
    if Lesson.query.count() == 0:
        for i in range(1, 22):
            try:
                with open(f'lessons/lesson{i}.txt', 'r') as f:
                    content = f.read().strip()
                lesson = Lesson(number=i, content=content, title=f"Lesson {i}")
                db.session.add(lesson)
                logging.info(f"Added lesson {i}")
            except FileNotFoundError:
                logging.warning(f"lessons/lesson{i}.txt not found")
        db.session.commit()

@app.route('/')
def index():
    lessons = Lesson.query.order_by(Lesson.number).all()
    user_progress = {}
    unlocked_lessons = [1]  # First lesson is always unlocked
    
    if current_user.is_authenticated:
        # Get user's progress for each lesson
        progress_records = Progress.query.filter_by(user_id=current_user.id).all()
        for progress in progress_records:
            user_progress[progress.lesson_id] = {
                'wpm': progress.wpm,
                'accuracy': progress.accuracy,
                'completed': progress.accuracy >= 95.0
            }
        
        # Calculate unlocked lessons based on 95% accuracy requirement
        for i in range(1, 22):
            if i == 1:  # First lesson always unlocked
                continue
            prev_progress = user_progress.get(i - 1)
            if prev_progress and prev_progress['completed']:
                unlocked_lessons.append(i)
            else:
                break  # Stop at first locked lesson
    
    return render_template('index.html', lessons=lessons, user_progress=user_progress, unlocked_lessons=unlocked_lessons)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if User.query.filter_by(username=username).first():
            flash("Username already exists.", "error")
            return redirect(url_for('register'))
        
        password_hash = generate_password_hash(password)
        user = User(username=username, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()
        
        flash("Account created successfully!", "success")
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash("Invalid username or password.", "error")
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/lesson/<int:lesson_id>')
def practice(lesson_id):
    lesson = Lesson.query.filter_by(id=lesson_id).first_or_404()
    
    # Check if lesson is unlocked for authenticated users
    if current_user.is_authenticated and lesson_id > 1:
        prev_progress = Progress.query.filter_by(
            user_id=current_user.id, 
            lesson_id=lesson_id - 1
        ).first()
        
        if not prev_progress or prev_progress.accuracy < 95.0:
            flash(f"You must complete Lesson {lesson_id - 1} with 95% accuracy to unlock this lesson.", "warning")
            return redirect(url_for('index'))
    
    # Allow guest access only for lesson 1
    if lesson_id != 1 and not current_user.is_authenticated:
        flash("Please login to access this lesson.", "info")
        return redirect(url_for('login'))
    
    # Get user's previous attempt for this lesson
    previous_attempt = None
    if current_user.is_authenticated:
        previous_attempt = Progress.query.filter_by(
            user_id=current_user.id, 
            lesson_id=lesson_id
        ).first()
    
    return render_template('practice.html', lesson=lesson, previous_attempt=previous_attempt)

@app.route('/save_progress/<int:lesson_id>', methods=['POST'])
@login_required
def save_progress(lesson_id):
    data = request.json
    wpm = data.get('wpm', 0)
    accuracy = data.get('accuracy', 0)
    time_taken = data.get('time_taken', 0)
    errors = data.get('errors', 0)
    
    # Find existing progress or create new
    progress = Progress.query.filter_by(user_id=current_user.id, lesson_id=lesson_id).first()
    if not progress:
        progress = Progress(user_id=current_user.id, lesson_id=lesson_id)
    
    # Update progress only if this attempt is better
    if wpm > progress.wpm or (wpm == progress.wpm and accuracy > progress.accuracy):
        progress.wpm = wpm
        progress.accuracy = accuracy
        progress.time_taken = time_taken
        progress.error_count = errors
    
    db.session.add(progress)
    db.session.commit()
    
    # Check for achievements
    achievements = []
    if accuracy >= 95.0 and lesson_id < 21:
        achievements.append(f"Lesson {lesson_id} completed! Lesson {lesson_id + 1} unlocked!")
    elif accuracy >= 95.0 and lesson_id == 21:
        achievements.append("Congratulations! You've completed all lessons!")
    
    if wpm >= 40 and accuracy >= 95.0:
        achievements.append("Speed Demon! 40+ WPM with 95%+ accuracy!")
    
    return jsonify({
        "status": "saved",
        "achievements": achievements,
        "accuracy_met": accuracy >= 95.0,
        "next_lesson_unlocked": accuracy >= 95.0 and lesson_id < 21
    })

@app.route('/lesson_complete/<int:lesson_id>')
@login_required
def lesson_complete(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    progress = Progress.query.filter_by(user_id=current_user.id, lesson_id=lesson_id).first()
    
    if not progress or progress.accuracy < 95.0:
        return redirect(url_for('practice', lesson_id=lesson_id))
    
    next_lesson = None
    if lesson_id < 21:
        next_lesson = Lesson.query.filter_by(number=lesson_id + 1).first()
    
    return render_template('lesson_complete.html', lesson=lesson, progress=progress, next_lesson=next_lesson)

@app.route('/progress')
@login_required
def progress():
    records = Progress.query.filter_by(user_id=current_user.id).order_by(Progress.lesson_id).all()
    lessons = {l.id: l for l in Lesson.query.all()}
    
    # Calculate statistics
    total_lessons = len(records)
    completed_lessons = len([r for r in records if r.accuracy >= 95.0])
    avg_wpm = sum(r.wpm for r in records) / len(records) if records else 0
    avg_accuracy = sum(r.accuracy for r in records) / len(records) if records else 0
    
    stats = {
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons,
        'avg_wpm': round(avg_wpm, 1),
        'avg_accuracy': round(avg_accuracy, 1),
        'completion_rate': round((completed_lessons / 21) * 100, 1)
    }
    
    return render_template('progress.html', records=records, lessons=lessons, stats=stats)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
