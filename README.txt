DriveIK project page — NTN template version
==========================================

NTN 페이지(https://engineerjpark.github.io/CVPR2025NTN/)의 Bulma 템플릿으로
다시 작성한 정적 사이트입니다. 설치나 빌드 없이 파일을 수정하면 됩니다.

자주 수정하는 파일 두 개
-----------------------
1. index.html
   제목, 저자, 소속, Abstract, 그림, 영상, 결과표, BibTeX가 전부 여기 있습니다.
   편집기에서 다음 번호를 검색하면 해당 부분으로 이동합니다.

   01. TITLE / AUTHORS / LINKS   제목, 저자, 소속, Paper/Video/BibTeX 버튼
   02. ABSTRACT                 Abstract와 Key Contributions
   03. OVERALL METHODS          방법 그림과 설명
   04. VIDEO OVERVIEW           전체 소개 영상
   05. QUANTITATIVE RESULTS     NAVSIM / nuScenes 결과표
   06. QUALITATIVE RESULTS      장애물 삽입 그림, 주행 / 개입 영상
   07. BIBTEX                   인용문
   08. TEMPLATE CREDIT          템플릿 출처와 라이선스

2. static/css/index.css
   첫 부분의 :root에서 자주 쓰는 값을 변경할 수 있습니다.

   --page-width: 960px;        본문 최대 너비
   --figure-width: 1040px;     그림 / 영상 최대 너비
   --body-size: 16px;          본문 글자 크기
   --title-size: 48px;         데스크톱 제목 크기
   --section-space: 3rem;      섹션 위아래 여백
   --light-background: ...;   회색 배경 색상
   --ours-background: ...;    결과표의 Ours 행 배경 색상

   모바일 설정은 같은 파일 아래쪽 @media 블록에 있습니다.
   static/css/bulma.min.css는 원본 프레임워크이므로 직접 편집하지 않아도 됩니다.

내용 수정 예시
-------------
그림 변경:
  assets/figures/에 새 파일을 넣고 해당 <img>의 src를 변경합니다.
  alt는 그림 설명, width/height는 원본 픽셀 크기로 설정하세요.
  <figcaption> ... </figcaption> 안에 그림 설명을 씁니다.
  클릭해 열리는 원본 PDF 링크도 함께 바꾸세요.

그림 하나만 너비 변경:
  해당 <figure>에 style="max-width: 850px; margin: 0 auto;"를 추가합니다.
  모든 그림 너비를 바꾸려면 CSS의 --figure-width를 수정합니다.

영상 변경:
  해당 <video>의 poster와 <source src="...">를 변경합니다.
  자막은 <track src="...">에 있는 .vtt 파일을 변경합니다.
  영상별로 독립된 HTML 블록이라 파일 하나를 바꾸기 위해 JS를 수정할 필요가 없습니다.

결과표 수정:
  해당 <table> 안에서 <td>숫자</td>를 직접 바꿉니다.
  행 추가는 <tr> ... </tr> 하나를 복사합니다.
  강조할 행에는 class="ours-row"를 지정합니다.

섹션 추가 / 순서 변경:
  <section> ... </section> 전체를 복사하거나 옮기면 됩니다.
  새 섹션에는 고유한 id를 사용하고 aria-labelledby도 해당 제목 id에 맞춥니다.

Code / arXiv 버튼 추가:
  상단의 <span class="link-block"> ... </span>을 복사하고 href와 버튼 글자를
  바꾸면 됩니다. 현재는 확인된 코드 / arXiv URL이 없어 버튼을 넣지 않았습니다.

BibTeX 변경:
  HTML의 인용문과 다운로드 파일 assets/citation.bib를 함께 수정합니다.
  Copy BibTeX 버튼은 HTML의 인용문을 읽으므로 별도 JS 데이터는 없습니다.

미리보기
--------
  cd /raid/local/pjs/Driving-VLA-project-page
  python -m http.server 8000 --bind 127.0.0.1

브라우저에서 http://localhost:8000 을 여세요.
원격 서버라면 ssh -L 8000:127.0.0.1:8000 <server> 로 포트 포워딩할 수 있습니다.
index.html을 직접 열어도 본문과 표는 표시됩니다. 자막은 HTTP 미리보기를 권장합니다.

GitHub Pages 반영
----------------
저장소: https://github.com/engineerJPark/NeurIPS-2026-DriveIK
페이지: https://engineerjpark.github.io/NeurIPS-2026-DriveIK/
배포 설정: Deploy from a branch / main / (root)

변경한 파일만 검토 후 커밋하고 main으로 push하면 Pages가 자동 배포합니다.
  git diff
  git add <수정한 파일들>
  git commit -m "Update project page"
  git push origin main

설정된 배포 URL은 HTML의 canonical / og:url / og:image / twitter:image에도
반영되어 있습니다. 저장소 이름이나 배포 주소를 바꾸면 이 값도 수정하세요.

구성 / 검증
-----------
static/css/bulma.min.css  NTN 페이지와 동일한 Bulma 0.9.1
static/css/fonts.css     Google Sans / Noto Sans 로컬 폰트 선언
static/js/index.js       BibTeX 복사 기능만 담당하는 선택적 스크립트
static/licenses/        Bulma / 폰트 라이선스
assets/figures/         논문 그림과 원본 PDF
assets/media/           영상 3종, 포스터, WebVTT 자막
assets/paper.pdf         제공된 논문 PDF
assets/data/provenance.json  논문 / 미디어 출처
THIRD_PARTY.txt          템플릿 출처와 변경 내역
scripts/verify_page.py  선택적 브라우저 검증 (Playwright + Chrome 필요)

외부 CDN, 추적기, 빌드 도구에 의존하지 않습니다.
본문, 결과표, 영상은 JavaScript를 꺼도 사용할 수 있습니다.
기존 디자인은 Git 커밋 4bf597e에서 확인할 수 있습니다.
