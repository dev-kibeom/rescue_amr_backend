# vision_ws/src/yolo/yolo/train.py
import os
import argparse
from ultralytics import YOLO


def main():
    # 🚀 1. 유연한 파라미터 튜닝을 위한 Argument Parser 설계
    parser = argparse.ArgumentParser(
        description="YOLO OBB Training Script for Smart Factory"
    )

    parser.add_argument(
        "--data",
        type=str,
        default="/home/kibeom/vision_ws/datasets/smart_factory/data.yaml",
        help="Path to data.yaml",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n-obb.pt",
        help="Base pretrained model for OBB",
    )
    parser.add_argument(
        "--epochs", type=int, default=100, help="Number of training epochs"
    )
    parser.add_argument(
        "--batch", type=int, default=16, help="Batch size (reduce if VRAM overflows)"
    )
    parser.add_argument("--imgsz", type=int, default=640, help="Train image size")
    parser.add_argument(
        "--device", type=str, default="0", help="GPU device index (e.g. 0) or 'cpu'"
    )
    parser.add_argument(
        "--project",
        type=str,
        default="/home/kibeom/vision_ws/runs",
        help="Project runs directory",
    )
    parser.add_argument(
        "--name", type=str, default="sf_yolo_obb", help="Experiment name"
    )

    args = parser.parse_args()

    # 🚀 2. 사전 학습된 기본 OBB 가중치 로드
    print(f"🔍 [MLOps] Base Pretrained Model 로드 중: {args.model}")
    model = YOLO(args.model)

    # 🚀 3. 학습 프로세스 실행 (V 모델 정량 평가 검증 데이터 자동 산출)
    print(f"🏋️‍♂️ [MLOps] YOLO OBB 파인튜닝 학습 시작...")
    model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        project=args.project,
        name=args.name,
        plots=True,  # Confusion Matrix, F1-Curve 등 시각화 리포트 자동 생성 (발표 가점 요소)
        save=True,  # 학습 완료 후 가중치 자동 저장
        val=True,  # 에포크마다 자동으로 Validation 셋 검증 수행
        cache=True,  # RAM 여유 시 데이터셋 캐싱으로 속도 향상
    )

    print(
        f"🎉 학습 완료! 최종 가중치 및 검증 리포트 저장 위치: {os.path.join(args.project, args.name)}"
    )


if __name__ == "__main__":
    main()

# (옵션) 에포크나 배치 사이즈를 다르게 해서 실험하고 싶을 때 터미널에서 제어
# ros2 run yolo yolo_train --epochs 50 --batch 8 --name sf_yolo_obb_exp2