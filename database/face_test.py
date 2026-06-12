import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import requests
import json
import os


class FaceSimilarityTester:
    def __init__(self, root):
        self.root = root
        self.root.title("🤖 ARES 얼굴 유사도 연산 테스트 GUI")
        self.root.geometry("600x550")
        self.root.configure(padx=20, pady=20)

        self.img1_path = None
        self.img2_path = None

        # ─── 1. API 엔드포인트 설정 영역 ───
        tk.Label(
            root, text="🔗 도커 API 엔드포인트 URL:", font=("Arial", 10, "bold")
        ).pack(anchor="w")
        self.url_entry = tk.Entry(root, width=70)
        # 도커 포트와 엔드포인트 주소에 맞게 수정하세요 (예: 8001 포트의 compare 주소)
        self.url_entry.insert(0, "http://localhost:8001/api/face/compare")
        self.url_entry.pack(pady=5)

        # ─── 2. 이미지 업로드 영역 ───
        frame_images = tk.Frame(root)
        frame_images.pack(pady=15)

        # 이미지 1 (기준 사진)
        frame_img1 = tk.Frame(frame_images)
        frame_img1.grid(row=0, column=0, padx=20)
        tk.Label(frame_img1, text="기준 사진 (DB 등록용 등)").pack()
        self.lbl_img1 = tk.Label(
            frame_img1, bg="gray", width=30, height=12, text="이미지 없음", fg="white"
        )
        self.lbl_img1.pack(pady=5)
        tk.Button(
            frame_img1, text="사진 선택", command=lambda: self.load_image(1)
        ).pack()

        # 이미지 2 (비교 사진)
        frame_img2 = tk.Frame(frame_images)
        frame_img2.grid(row=0, column=1, padx=20)
        tk.Label(frame_img2, text="비교 대상 (현장 포착 사진 등)").pack()
        self.lbl_img2 = tk.Label(
            frame_img2, bg="gray", width=30, height=12, text="이미지 없음", fg="white"
        )
        self.lbl_img2.pack(pady=5)
        tk.Button(
            frame_img2, text="사진 선택", command=lambda: self.load_image(2)
        ).pack()

        # ─── 3. 연산 실행 버튼 ───
        self.btn_compare = tk.Button(
            root,
            text="🔥 유사도 계산 실행",
            font=("Arial", 12, "bold"),
            bg="#2ecc71",
            fg="black",
            command=self.run_comparison,
        )
        self.btn_compare.pack(pady=15, fill="x")

        # ─── 4. 결과 출력 영역 ───
        tk.Label(root, text="📊 API 응답 결과:", font=("Arial", 10, "bold")).pack(
            anchor="w"
        )
        self.txt_result = tk.Text(root, height=8, width=70, bg="#f4f6f7")
        self.txt_result.pack(pady=5)

    def load_image(self, img_num):
        # 💡 윈도우용 세미콜론(;)을 리눅스용 공백으로 바꾸고, 대문자 확장자까지 모두 포획합니다.
        file_path = filedialog.askopenfilename(
            filetypes=[
                ("Image Files", "*.png *.jpg *.jpeg *.PNG *.JPG *.JPEG"),
                ("All Files", "*.*"),
            ]
        )

        if not file_path:
            return

        # 썸네일 생성 및 라벨에 표시
        try:
            img = Image.open(file_path)
            img.thumbnail((200, 200))
            photo = ImageTk.PhotoImage(img)

            if img_num == 1:
                self.img1_path = file_path
                self.lbl_img1.config(image=photo, text="", bg="black")
                self.lbl_img1.image = photo
            else:
                self.img2_path = file_path
                self.lbl_img2.config(image=photo, text="", bg="black")
                self.lbl_img2.image = photo
        except Exception as e:
            messagebox.showerror(
                "이미지 로드 에러", f"이미지를 불러오는 데 실패했습니다.\n{e}"
            )

    def run_comparison(self):
        url = self.url_entry.get().strip()

        if not self.img1_path or not self.img2_path:
            messagebox.showwarning("경고", "두 이미지를 모두 업로드해주세요.")
            return

        self.btn_compare.config(text="연산 중...", state="disabled")
        self.txt_result.delete(1.0, tk.END)
        self.root.update()

        try:
            # 💡 파일 키 이름('image1', 'image2')은 도커 Flask 서버에서 받는 파라미터명과 동일해야 합니다.
            with open(self.img1_path, "rb") as f1, open(self.img2_path, "rb") as f2:
                files = {
                    "image1": (os.path.basename(self.img1_path), f1, "image/jpeg"),
                    "image2": (os.path.basename(self.img2_path), f2, "image/jpeg"),
                }

                # 도커 API로 POST 전송
                response = requests.post(url, files=files, timeout=10)

            if response.status_code == 200:
                result_data = response.json()
                formatted_json = json.dumps(result_data, indent=4, ensure_ascii=False)
                self.txt_result.insert(tk.END, formatted_json)
            else:
                self.txt_result.insert(
                    tk.END,
                    f"❌ 서버 에러 (HTTP {response.status_code}):\n{response.text}",
                )

        except requests.exceptions.ConnectionError:
            self.txt_result.insert(
                tk.END,
                f"❌ 서버 연결 실패!\n도커 컨테이너가 켜져 있는지, URL({url})이 맞는지 확인하세요.",
            )
        except Exception as e:
            self.txt_result.insert(tk.END, f"❌ 예기치 않은 오류 발생:\n{e}")
        finally:
            self.btn_compare.config(text="🔥 유사도 계산 실행", state="normal")


if __name__ == "__main__":
    root = tk.Tk()
    app = FaceSimilarityTester(root)
    root.mainloop()
