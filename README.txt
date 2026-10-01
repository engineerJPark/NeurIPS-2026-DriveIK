Grounding Driving VLA via Inverse Kinematics — Project Page
==========================================================

설치나 빌드가 필요 없는 독립형 정적 웹사이트입니다.
HTML, CSS, JavaScript, 논문 PDF, 실험 이미지, 폰트, 영상이 모두 포함되어 있습니다.

미리보기
--------
터미널에서 실행:

  cd /raid/local/pjs/Driving-VLA-project-page
  python -m http.server 8000 --bind 127.0.0.1

브라우저에서 http://localhost:8000 을 여세요.
원격 서버라면 SSH 포트 포워딩을 사용할 수 있습니다:

  ssh -L 8000:127.0.0.1:8000 <server>

index.html을 직접 열어도 기본 페이지는 작동합니다. 브라우저의 file:// 보안
정책에 따라 자막 로딩이 제한될 수 있어 HTTP 미리보기를 권장합니다.

편집 위치
---------
index.html                 제목, 저자, 본문, 표, 논문/인용 링크
styles.css                 디자인, 색상, 데스크톱/모바일 레이아웃
app.js                     비교 실험, 결과 탭, 영상 선택, BibTeX 복사
assets/data/experiments.js  실제 저장된 K=50 평균 궤적과 실험 수치
assets/data/provenance.json 그림, 영상, 결과의 출처와 해석 범위
assets/citation.bib        다운로드용 BibTeX (HTML의 인용문과 함께 수정)
assets/paper.pdf           제공된 논문 PDF
assets/media/              원본 데모 영상, WebVTT 자막, 영상 포스터
assets/figures/            Overleaf 논문 그림 (WebP 및 원본 벡터 PDF)
assets/scenes/             원본/장애물 삽입 장면 (무손실 WebP)

공개 배포
---------
폴더 내용 그대로 GitHub Pages 또는 정적 파일 호스팅에 올릴 수 있습니다.
모든 리소스 경로는 상대 경로라서 /project-name/ 같은 하위 경로에서도 동작합니다.
GitHub Pages에서는 이 폴더의 내용을 저장소 루트에 넣고 해당 branch/root를
배포 대상으로 지정하세요. .nojekyll 파일이 포함되어 있습니다.
배포 주소가 정해지면 index.html의 og:image를 절대 URL로 바꾸고
og:url과 canonical URL을 추가하면 소셜 공유 미리보기에 도움이 됩니다.
현재는 로컬 파일만 작성되어 있으며 외부 사이트에 게시하지 않았습니다.

연구 내용과 데이터
-----------------
제목/저자/소속은 제공된 PDF 및 Overleaf 소스에서 가져왔습니다.
수치는 tables/navsim_v1_exp.tex, navsim_v2_exp.tex, main_exp.tex,
stitching_exp.tex 및 기존 Reel 실험 데이터와 대조했습니다.
NAVSIM의 0.5B OpenDriveVLA*는 학습 조건을 맞춘 비교군입니다.
nuScenes의 OpenDriveVLA는 논문에 보고된 원래 비교군입니다.
0.06 m는 ST-P3 프로토콜의 평균 L2입니다. UniAD 프로토콜 평균은 0.13 m입니다.
실험의 개별 장면 변화량과 데이터셋 평균은 별도로 표시합니다.
궤적은 제공된 실제 저장 예측의 여섯 waypoint를 연결해 표시합니다.
영상은 기존 결과물을 그대로 복사했으며 주행 예시의 보간 재생 여부를 명시합니다.
공개 코드/arXiv URL 또는 학회 채택 여부는 확인되지 않아 임의로 만들지 않았습니다.
인용은 2026 preprint로 표기했습니다.

외부 네트워크 요청, 분석 추적기, CDN 의존성은 없습니다.
