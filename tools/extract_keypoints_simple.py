#!/usr/bin/env python3
"""
Tool semplificato per estrarre keypoints MediaPipe dai video PT
"""

import sys
import os

def main():
    print("🎯 KEYPOINT EXTRACTOR")
    print("=====================")
    
    if len(sys.argv) < 2:
        print("❌ Usage: python extract_keypoints_simple.py <video_file>")
        return
        
    video_file = sys.argv[1]
    print(f"📹 Video: {video_file}")
    print(f"📁 Path assoluto: {os.path.abspath(video_file)}")
    print(f"📄 File esiste: {os.path.exists(video_file)}")
    
    # Test import
    try:
        import cv2
        print("✅ OpenCV importato")
    except Exception as e:
        print(f"❌ Errore OpenCV: {e}")
        return
        
    try:
        import mediapipe as mp
        print("✅ MediaPipe importato")
    except Exception as e:
        print(f"❌ Errore MediaPipe: {e}")
        return
    
    # Test video
    try:
        cap = cv2.VideoCapture(video_file)
        if cap.isOpened():
            fps = cap.get(cv2.CAP_PROP_FPS)
            frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            print(f"✅ Video aperto: {fps} FPS, {frames} frames")
            cap.release()
        else:
            print("❌ Impossibile aprire video")
            return
    except Exception as e:
        print(f"❌ Errore video: {e}")
        return
        
    print("🎉 Tutto OK! Il sistema può processare i video.")

if __name__ == "__main__":
    main()
