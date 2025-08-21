import math

def calculate_wpm(text, time_seconds):
    """Calculate Words Per Minute based on standard 5 characters per word"""
    if time_seconds <= 0:
        return 0
    characters = len(text)
    words = characters / 5  # Standard WPM calculation
    minutes = time_seconds / 60
    return round(words / minutes, 2) if minutes > 0 else 0

def calculate_accuracy(original, typed):
    """Calculate typing accuracy percentage"""
    if len(original) == 0:
        return 100.0
    
    # Compare character by character up to the length of typed text
    correct = 0
    total = len(original)
    
    for i in range(min(len(original), len(typed))):
        if original[i] == typed[i]:
            correct += 1
    
    # Account for extra characters typed (errors)
    if len(typed) > len(original):
        # Extra characters are errors
        total = len(typed)
    
    return round((correct / total) * 100, 2) if total > 0 else 100.0

def format_time(seconds):
    """Format seconds into MM:SS format"""
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    return f"{minutes:02d}:{remaining_seconds:02d}"

def calculate_grade(wpm, accuracy):
    """Calculate a grade based on WPM and accuracy"""
    if accuracy < 80:
        return "Needs Practice"
    elif accuracy >= 95 and wpm >= 40:
        return "Expert"
    elif accuracy >= 95 and wpm >= 25:
        return "Advanced"
    elif accuracy >= 90:
        return "Intermediate" 
    elif accuracy >= 85:
        return "Developing"
    else:
        return "Beginner"

def get_lesson_requirements(lesson_number):
    """Get the accuracy and WPM requirements for a lesson"""
    requirements = {
        'accuracy': 95.0,  # All lessons require 95% accuracy
        'recommended_wpm': max(10, lesson_number * 2)  # Progressive WPM goals
    }
    return requirements

def calculate_typing_errors(original, typed):
    """Calculate detailed error information"""
    errors = []
    for i in range(max(len(original), len(typed))):
        if i >= len(typed):
            errors.append({
                'position': i,
                'type': 'missing',
                'expected': original[i] if i < len(original) else '',
                'actual': ''
            })
        elif i >= len(original):
            errors.append({
                'position': i,
                'type': 'extra',
                'expected': '',
                'actual': typed[i]
            })
        elif original[i] != typed[i]:
            errors.append({
                'position': i,
                'type': 'incorrect',
                'expected': original[i],
                'actual': typed[i]
            })
    
    return errors
