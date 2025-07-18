#!/usr/bin/env python3
"""
Genera keypoints demo realistici per i video PT esistenti
"""

import json
import os
from datetime import datetime

def create_realistic_keypoints(exercise_name, duration_seconds=7, fps=60):
    """Crea keypoints demo realistici per un esercizio"""
    
    total_frames = int(duration_seconds * fps)
    keypoints_data = []
    
    # MediaPipe Pose keypoints (33 punti)
    base_keypoints = [
        {"x": 0.5, "y": 0.2, "z": -0.1, "visibility": 0.9},   # 0: nose
        {"x": 0.48, "y": 0.19, "z": -0.12, "visibility": 0.8}, # 1: left_eye_inner
        {"x": 0.47, "y": 0.18, "z": -0.11, "visibility": 0.8}, # 2: left_eye
        {"x": 0.46, "y": 0.19, "z": -0.1, "visibility": 0.7},  # 3: left_eye_outer
        {"x": 0.52, "y": 0.19, "z": -0.12, "visibility": 0.8}, # 4: right_eye_inner
        {"x": 0.53, "y": 0.18, "z": -0.11, "visibility": 0.8}, # 5: right_eye
        {"x": 0.54, "y": 0.19, "z": -0.1, "visibility": 0.7},  # 6: right_eye_outer
        {"x": 0.47, "y": 0.21, "z": -0.08, "visibility": 0.6}, # 7: left_ear
        {"x": 0.53, "y": 0.21, "z": -0.08, "visibility": 0.6}, # 8: right_ear
        {"x": 0.48, "y": 0.24, "z": -0.05, "visibility": 0.7}, # 9: mouth_left
        {"x": 0.52, "y": 0.24, "z": -0.05, "visibility": 0.7}, # 10: mouth_right
        {"x": 0.45, "y": 0.35, "z": -0.2, "visibility": 0.9},  # 11: left_shoulder
        {"x": 0.55, "y": 0.35, "z": -0.2, "visibility": 0.9},  # 12: right_shoulder
        {"x": 0.4, "y": 0.5, "z": -0.15, "visibility": 0.8},   # 13: left_elbow
        {"x": 0.6, "y": 0.5, "z": -0.15, "visibility": 0.8},   # 14: right_elbow
        {"x": 0.35, "y": 0.65, "z": -0.1, "visibility": 0.7},  # 15: left_wrist
        {"x": 0.65, "y": 0.65, "z": -0.1, "visibility": 0.7},  # 16: right_wrist
        {"x": 0.33, "y": 0.67, "z": -0.08, "visibility": 0.6}, # 17: left_pinky
        {"x": 0.67, "y": 0.67, "z": -0.08, "visibility": 0.6}, # 18: right_pinky
        {"x": 0.32, "y": 0.66, "z": -0.09, "visibility": 0.6}, # 19: left_index
        {"x": 0.68, "y": 0.66, "z": -0.09, "visibility": 0.6}, # 20: right_index
        {"x": 0.34, "y": 0.68, "z": -0.07, "visibility": 0.6}, # 21: left_thumb
        {"x": 0.66, "y": 0.68, "z": -0.07, "visibility": 0.6}, # 22: right_thumb
        {"x": 0.48, "y": 0.7, "z": -0.25, "visibility": 0.9},  # 23: left_hip
        {"x": 0.52, "y": 0.7, "z": -0.25, "visibility": 0.9},  # 24: right_hip
        {"x": 0.47, "y": 0.85, "z": -0.2, "visibility": 0.8},  # 25: left_knee
        {"x": 0.53, "y": 0.85, "z": -0.2, "visibility": 0.8},  # 26: right_knee
        {"x": 0.46, "y": 0.95, "z": -0.1, "visibility": 0.7},  # 27: left_ankle
        {"x": 0.54, "y": 0.95, "z": -0.1, "visibility": 0.7},  # 28: right_ankle
        {"x": 0.45, "y": 0.93, "z": -0.05, "visibility": 0.6}, # 29: left_heel
        {"x": 0.55, "y": 0.93, "z": -0.05, "visibility": 0.6}, # 30: right_heel
        {"x": 0.44, "y": 0.97, "z": -0.02, "visibility": 0.6}, # 31: left_foot_index
        {"x": 0.56, "y": 0.97, "z": -0.02, "visibility": 0.6}, # 32: right_foot_index
    ]
    
    for frame in range(total_frames):
        progress = frame / total_frames
        modified_keypoints = modify_keypoints_for_exercise(base_keypoints, exercise_name, progress)
        
        keypoints_data.append({
            "keypoints": modified_keypoints,
            "timestamp": frame * (1000 / fps),  # milliseconds
            "frameNumber": frame
        })
    
    return {
        "exerciseName": exercise_name,
        "keypoints": keypoints_data,
        "metadata": {
            "frameRate": fps,
            "totalFrames": total_frames,
            "duration": duration_seconds,
            "captureDate": datetime.now().isoformat(),
            "sourceVideo": f"{exercise_name}.mp4",
            "isGenerated": True,
            "description": f"Keypoints demo realistici per {exercise_name}"
        }
    }

def modify_keypoints_for_exercise(keypoints, exercise, progress):
    """Modifica i keypoints per simulare movimenti specifici dell'esercizio"""
    import math
    modified = [kp.copy() for kp in keypoints]
    
    if exercise == "squat":
        # Movimento squat: 2 ripetizioni complete
        squat_cycle = math.sin(progress * math.pi * 4) * 0.12  # 2 squat completi
        
        # Modifica fianchi e ginocchia
        modified[23]["y"] += abs(squat_cycle)  # left_hip
        modified[24]["y"] += abs(squat_cycle)  # right_hip
        modified[25]["y"] += abs(squat_cycle) * 1.2  # left_knee
        modified[26]["y"] += abs(squat_cycle) * 1.2  # right_knee
        
        # Braccia estese avanti durante discesa
        arm_extension = abs(squat_cycle) * 0.8
        modified[13]["x"] += arm_extension * 0.3  # left_elbow forward
        modified[14]["x"] -= arm_extension * 0.3  # right_elbow forward
        modified[15]["x"] += arm_extension * 0.5  # left_wrist forward
        modified[16]["x"] -= arm_extension * 0.5  # right_wrist forward
        
    elif exercise == "push_up" or exercise == "pushup":
        # Movimento push-up: 3 ripetizioni
        pushup_cycle = math.sin(progress * math.pi * 6) * 0.08  # 3 push-up
        
        # Modifica braccia
        modified[13]["y"] += abs(pushup_cycle)  # left_elbow
        modified[14]["y"] += abs(pushup_cycle)  # right_elbow
        modified[15]["y"] += abs(pushup_cycle) * 1.5  # left_wrist
        modified[16]["y"] += abs(pushup_cycle) * 1.5  # right_wrist
        
        # Corpo in plank position
        for i in [11, 12, 23, 24]:  # shoulders and hips
            modified[i]["y"] += 0.15  # più basso per plank
            
    elif exercise == "lunges" or exercise == "lunge":
        # Movimento lunge alternato
        lunge_cycle = math.sin(progress * math.pi * 4) * 0.15  # 2 lunge completi
        
        # Gamba anteriore
        modified[25]["x"] += lunge_cycle  # left_knee forward/back
        modified[27]["x"] += lunge_cycle  # left_ankle forward/back
        modified[25]["y"] += abs(lunge_cycle) * 0.6  # knee down
        
        # Gamba posteriore
        modified[26]["x"] -= lunge_cycle * 0.5  # right_knee back
        modified[28]["x"] -= lunge_cycle * 0.5  # right_ankle back
        
    elif exercise == "crunch":
        # Movimento crunch: contrazione addominale
        crunch_cycle = math.sin(progress * math.pi * 6) * 0.1  # 3 crunch
        
        # Testa e spalle che si alzano
        modified[0]["y"] -= abs(crunch_cycle)  # nose up
        modified[11]["y"] -= abs(crunch_cycle) * 0.8  # left_shoulder up
        modified[12]["y"] -= abs(crunch_cycle) * 0.8  # right_shoulder up
        
        # Braccia dietro la testa
        modified[13]["x"] -= 0.1  # left_elbow back
        modified[14]["x"] += 0.1  # right_elbow back
        modified[15]["x"] -= 0.15  # left_wrist back
        modified[16]["x"] += 0.15  # right_wrist back
        
    elif exercise == "reverse_crunch":
        # Movimento reverse crunch: gambe che si alzano
        reverse_cycle = math.sin(progress * math.pi * 6) * 0.12  # 3 reverse crunch
        
        # Ginocchia verso il petto
        modified[25]["y"] -= abs(reverse_cycle)  # left_knee up
        modified[26]["y"] -= abs(reverse_cycle)  # right_knee up
        modified[27]["y"] -= abs(reverse_cycle) * 0.8  # left_ankle up
        modified[28]["y"] -= abs(reverse_cycle) * 0.8  # right_ankle up
        
        # Fianchi che si alzano leggermente
        modified[23]["y"] -= abs(reverse_cycle) * 0.3  # left_hip up
        modified[24]["y"] -= abs(reverse_cycle) * 0.3  # right_hip up
    
    return modified

def main():
    # Video presenti nella cartella
    videos = [
        ("SQUAT", "squat"),
        ("PUSH UP", "push_up"), 
        ("LUNGES", "lunges"),
        ("CRUNCH", "crunch"),
        ("REVERSE CRUNCH", "reverse_crunch")
    ]
    
    output_dir = "/workspaces/AttachmentAnalyzer/server/assets/keypoints_pt"
    os.makedirs(output_dir, exist_ok=True)
    
    print("🎯 GENERAZIONE KEYPOINTS REALISTICI")
    print("=" * 40)
    
    for video_name, exercise_name in videos:
        print(f"🎬 Generando keypoints per: {video_name}")
        
        # Genera keypoints realistici
        keypoints_data = create_realistic_keypoints(exercise_name, duration_seconds=7, fps=60)
        
        # Salva JSON
        output_file = os.path.join(output_dir, f"{exercise_name}_keypoints.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(keypoints_data, f, indent=2, ensure_ascii=False)
            
        frames_count = len(keypoints_data["keypoints"])
        print(f"✅ Salvato: {output_file}")
        print(f"📊 Frame generati: {frames_count}")
        print()
    
    print("🎉 Generazione completata!")
    print(f"📁 Keypoints salvati in: {output_dir}")

if __name__ == "__main__":
    main()
