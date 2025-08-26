import os
import logging
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash, check_password_hash
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from itsdangerous import URLSafeTimedSerializer

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "you-should-change-this-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the database - MySQL/PostgreSQL compatible
# Get DATABASE_URL
db_url = os.environ.get("DATABASE_URL")

if not db_url:
    raise RuntimeError("DATABASE_URL is not set! Check Render environment variables.")

# Fix for SQLAlchemy
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
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
login_manager.login_view = 'login'  # type: ignore

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
                lesson = Lesson()
                lesson.number = i
                lesson.content = content
                lesson.title = f"Lesson {i}"
                db.session.add(lesson)
                logging.info(f"Added lesson {i}")
            except FileNotFoundError:
                logging.warning(f"lessons/lesson{i}.txt not found")
        db.session.commit()

@app.route('/')
def home():
    return render_template('home.html')
@app.route('/index')
@app.route('/lessons')
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
        # Fixed registration with proper validation
        email = request.form.get('email', '').strip()
        first_name = request.form.get('first_name', '').strip()
        last_name = request.form.get('last_name', '').strip()
        password = request.form.get('password', '')
        
        # Validation
        if not email or not first_name or not last_name or not password:
            flash("All fields are required.", "error")
            return redirect(url_for('register'))
        
        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "error")
            return redirect(url_for('register'))
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            flash("Email already exists.", "error")
            return redirect(url_for('register'))
        
        try:
            password_hash = generate_password_hash(password)
            user = User()
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.password_hash = password_hash
            db.session.add(user)
            db.session.commit()
            
            flash("Account created successfully! Please login.", "success")
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            logging.error(f"Registration error: {e}")
            flash("An error occurred during registration. Please try again.", "error")
            return redirect(url_for('register'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('home'))
        else:
            flash("Invalid email or password.", "error")
    
    return render_template('login.html')

# Email Configuration (Gmail SMTP)
app.config['MAIL_USERNAME'] = 'jeancloete.ncape@gmail.com'
app.config['MAIL_PASSWORD'] = 'your-app-password'  # NOT your regular password

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        if not email:
            flash("Email is required.", "error")
            return redirect(url_for('forgot_password'))

        user = User.query.filter_by(email=email).first()
        if not user:
            flash("If that email is registered, a password reset link has been sent.", "info")
            return redirect(url_for('login'))

        # Generate reset token
        token = serializer.dumps(user.email, salt='password-reset-salt')
        reset_url = url_for('reset_password', token=token, _external=True)

        # Send email via SMTP
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Password Reset Request"
            msg["From"] = app.config['MAIL_USERNAME']
            msg["To"] = email

            text = f"""
            Hello,

            You requested a password reset for your TypingPro account.

            Click the link below to reset your password:
            {reset_url}

            This link expires in 1 hour.

            If you didn't request this, please ignore this email.

            Best regards,
            The TypingPro Team
            """

            html = f"""
            <p>Hello,</p>
            <p>You requested a password reset for your <strong>TypingPro</strong> account.</p>
            <p><a href="{reset_url}" style="color: #10b981; font-weight: 600;">Reset Your Password</a></p>
            <p><small>This link expires in 1 hour.</small></p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br><strong>The TypingPro Team</strong></p>
            """

            part1 = MIMEText(text, "plain")
            part2 = MIMEText(html, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
                server.sendmail(msg["From"], msg["To"], msg.as_string())

            flash("If that email is registered, a password reset link has been sent.", "info")
            return redirect(url_for('login'))

        except Exception as e:
            logging.error(f"SMTP Email Error: {e}")
            flash("Failed to send email. Please try again.", "error")
            return redirect(url_for('forgot_password'))

    return render_template('forgot_password.html')

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
    except Exception:
        flash("Invalid or expired link.", "error")
        return redirect(url_for('forgot_password'))

    if request.method == 'POST':
        password = request.form.get('password', '')
        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "error")
            return redirect(url_for('reset_password', token=token))

        user = User.query.filter_by(email=email).first()
        if user:
            user.password_hash = generate_password_hash(password)
            db.session.commit()
            flash("Your password has been updated.", "success")
            return redirect(url_for('login'))

    return render_template('reset_password.html', token=token)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

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
    data = request.json or {}
    wpm = data.get('wpm', 0)
    accuracy = data.get('accuracy', 0)
    time_taken = data.get('time_taken', 0)
    errors = data.get('errors', 0)
    
    # Find existing progress or create new
    progress = Progress.query.filter_by(user_id=current_user.id, lesson_id=lesson_id).first()
    if not progress:
        progress = Progress()
        progress.user_id = current_user.id
        progress.lesson_id = lesson_id
    
    # Update progress only if this attempt is better
    # Always update if current accuracy is < 95%
    current_accuracy = progess.accuracy if progress.accuracy is None else 0.0
    current_wpm = progress.wpm if progress.wpm is not None else 0
    if current_accuracy < 95.0:
        progress.wpm = wpm
        progress.accuracy = accuracy
        progress.time_taken = time_taken
        progress.error_count = errors
    else:
        # Only update if new attempt is better (protect passing score)
        if wpm > progress.wpm or (wpm == progress.wpm and accuracy > progress.accuracy):
            progress.wpm = wpm
            progress.accuracy = accuracy
            progress.time_taken = time_taken
            progress.error_count = errors
    
    db.session.add(progress)
    db.session.commit()
    
    # Check for achievements
    achievements = []
    if accuracy >= 95.0 and lesson_id < 23:
        achievements.append(f"Lesson {lesson_id} completed! Lesson {lesson_id + 1} unlocked!")
    elif accuracy >= 95.0 and lesson_id == 23:
        achievements.append("Congratulations! You've completed all lessons!")
    
    if wpm >= 40 and accuracy >= 95.0:
        achievements.append("Speed Demon! 40+ WPM with 95%+ accuracy!")
    
    return jsonify({
        "status": "saved",
        "achievements": achievements,
        "accuracy_met": accuracy >= 95.0,
        "next_lesson_unlocked": accuracy >= 95.0 and lesson_id < 23
    })

@app.route('/lesson_complete/<int:lesson_id>')
@login_required
def lesson_complete(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    progress = Progress.query.filter_by(user_id=current_user.id, lesson_id=lesson_id).first()
    
    # Must have completed with ≥95% accuracy
    if not progress or progress.accuracy < 95.0:
        return redirect(url_for('practice', lesson_id=lesson_id))
    
    next_lesson = None
    if lesson_id < 23:
        next_lesson = Lesson.query.filter_by(number=lesson.number + 1).first()
    
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
