#!/usr/bin/env python3
"""
Tool per estrarre keypoints MediaPipe dai video PT
Usage: python extract_keypoints.py video_file.mp4
"""

import cv2
import mediapipe as mp
import json
import sys
import os
from datetime import datetime

class KeypointExtractor:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def extract_from_video(self, video_path: str, output_dir: str = None):
        """Estrae keypoints da un video e salva il JSON"""
        
        print(f"🎥 Estraendo keypoints da video PT professionale: {os.path.basename(video_path)}")
        
        if not os.path.exists(video_path):
            print(f"❌ Video non trovato: {video_path}")
            return None
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"❌ Impossibile aprire video: {video_path}")
            return None
            
        # Metadata video
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps
        
        print(f"🎥 Analizzando: {video_path}")
        print(f"📊 FPS: {fps}, Frames: {total_frames}, Durata: {duration:.1f}s")
        
        keypoints_data = []
        frame_number = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Converti BGR a RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Estrai pose
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                # Converti keypoints in formato JSON
                keypoints = []
                for landmark in results.pose_landmarks.landmark:
                    keypoints.append({
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": landmark.visibility
                    })
                
                keypoints_data.append({
                    "keypoints": keypoints,
                    "timestamp": frame_number * (1000 / fps),  # milliseconds
                    "frameNumber": frame_number
                })
            
            frame_number += 1
            if frame_number % 30 == 0:  # Progress ogni secondo
                print(f"⏳ Processati {frame_number}/{total_frames} frames...")
        
        cap.release()
        
        # Crea output data
        exercise_name = os.path.splitext(os.path.basename(video_path))[0]
        clean_exercise_name = exercise_name.lower().replace(" ", "_").replace("-", "_")
        output_data = {
            "exerciseName": clean_exercise_name,
            "keypoints": keypoints_data,
            "metadata": {
                "frameRate": fps,
                "totalFrames": total_frames,
                "duration": duration,
                "captureDate": datetime.now().isoformat(),
                "sourceVideo": video_path
            }
        }
        
        # Salva JSON nella cartella keypoints_pt
        if output_dir is None:
            # Salva sempre nella cartella keypoints_pt
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(video_path)))
            output_dir = os.path.join(project_root, "server", "assets", "keypoints_pt")
            
        # Crea la directory se non esiste
        os.makedirs(output_dir, exist_ok=True)
        
        # Normalizza il nome dell'esercizio (rimuovi spazi, lowercase)
        clean_exercise_name = exercise_name.lower().replace(" ", "_").replace("-", "_")
        output_file = os.path.join(output_dir, f"{clean_exercise_name}_keypoints.json")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
            
        print(f"✅ Keypoints salvati: {output_file}")
        print(f"📈 Estratti {len(keypoints_data)} frame con pose")
        
        return output_data

def main():
    if len(sys.argv) < 2:
        print("❌ Usage: python extract_keypoints.py <video_file>")
        print("🎯 Esempio: python extract_keypoints.py squat.mp4")
        return
        
    video_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    extractor = KeypointExtractor()
    result = extractor.extract_from_video(video_file, output_dir)
    
    if result:
        print("🎉 Estrazione completata!")
    else:
        print("💥 Errore durante estrazione")

if __name__ == "__main__":
    main()
