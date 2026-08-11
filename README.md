# AI팀 서브에이전트 (Claude Code / Antigravity용)

SaaS, 앱, 로컬 서비스 등 여러 프로젝트에 공용으로 쓸 수 있는 Claude Code 서브에이전트 20종. 각 파일은 하나의 "역할"을 맡은 AI 팀원이다.

기본 기술 스택(Next.js + TypeScript + Tailwind + uipro-cli + Supabase + Google Sheets/Apps Script/Forms + AWS Amplify)은 `TECH_STACK.md`에 정리되어 있고, 관련 역할(frontend-developer, backend-developer, web-app-publisher, mobile-app-developer, project-manager, qa-reviewer, privacy-security-officer)에 이미 반영되어 있다.

## 구성

| 파일 | 역할 | 주로 담당 |
|---|---|---|
| ceo-advisor.md | 대표 | 방향 승인, 우선순위 최종 판단 |
| product-manager.md | 프로덕트 매니저 | 무엇을 왜 만드는가, PRD, 로드맵 |
| project-manager.md | 프로젝트 매니저 | 일정/작업 분해, 진행 추적 |
| product-planner.md | 상품기획 | 상품/요금제 구성, 가격 정책, 라인업 |
| service-planner.md | 서비스기획 | 기능 상세 플로우, 화면 정의서, 예외처리 |
| ui-ux-designer.md | UI/UX 디자이너 | 제품 화면 설계, 인터랙션, 디자인 시스템 |
| logo-designer.md | 로고/BI 디자이너 | 로고, 브랜드 컬러/타이포, BI 가이드 |
| product-detail-designer.md | 상세페이지 디자이너 | 판매/랜딩 페이지 구성, 전환 설계 |
| ux-writer.md | UX라이터 | 버튼/에러/온보딩 등 제품 내 문구 |
| marketer.md | 마케터 | 포지셔닝, 랜딩페이지, 런칭 전략 |
| researcher.md | 리서쳐 | 경쟁사/시장/가설 검증 |
| web-app-publisher.md | 퍼블리셔 | 디자인 → HTML/CSS 마크업, 반응형 |
| backend-developer.md | 백엔드 개발자 | API, DB, 서버 로직, 인증/인가, 외부 연동 |
| frontend-developer.md | 프론트엔드 개발자 | 상태관리, API 연동, 인터랙션 로직, 렌더링 성능 |
| mobile-app-developer.md | 앱 개발자 | iOS/Android 네이티브·하이브리드·React Native·Flutter |
| qa-reviewer.md | QA/코드리뷰 | 코드 리뷰, 테스트 설계, 배포 점검 |
| privacy-security-officer.md | 개인정보·보안 | 개인정보처리방침, PIPA 대응, 보안 점검 |
| video-scriptwriter.md | 영상 기획/대본 | 영상 목적/타겟 정의, 대본, 스토리보드 |
| video-editor.md | 영상 편집 디렉션 | 컷 구성/템포/자막 지시, 제목·썸네일 최적화 |
| sns-marketer.md | SNS 마케터 | 채널별 콘텐츠 캘린더, 캡션/해시태그, 커뮤니티 운영 |

## 설치 방법 — 모든 프로젝트에서 공용으로 쓰기 (권장)

SaaS, 앱, 로컬 서비스 등 여러 프로젝트에 걸쳐 같은 팀을 쓰고 싶다면, **사용자(전역) 레벨**에 설치한다. 홈 디렉토리 기준:

```bash
mkdir -p ~/.claude/agents
cp ai-team-agents/*.md ~/.claude/agents/
```

(README.md는 복사할 필요 없음 — developer.md도 제외하고 나머지 20개 파일만)

이렇게 하면 새 프로젝트를 만들 때마다 다시 설치할 필요 없이, 어떤 프로젝트에서 Claude Code를 열든 이 10개 에이전트가 자동으로 사용 가능하다.

## 프로젝트별로 일부만 수정하고 싶을 때 (오버라이드)

Claude Code는 **같은 이름의 에이전트가 프로젝트 폴더에도 있으면 프로젝트 쪽을 우선 적용**한다. 즉:

- 기본은 전역(`~/.claude/agents/`)에 있는 공용 팀을 그대로 쓴다.
- 특정 프로젝트에서 한 역할만 다르게 운영하고 싶으면(예: 이 프로젝트는 백엔드가 특정 스택이라 developer.md를 다르게 써야 함), **그 파일 하나만** 해당 프로젝트의 `.claude/agents/`에 복사해서 수정한다.

```bash
# 프로젝트 루트에서, developer 역할만 이 프로젝트용으로 커스터마이징할 때
mkdir -p .claude/agents
cp ~/.claude/agents/developer.md .claude/agents/developer.md
# 이후 .claude/agents/developer.md 를 이 프로젝트에 맞게 수정
```

나머지 9개 에이전트는 전역 설정을 그대로 상속받고, developer만 이 프로젝트 전용으로 동작한다. 프로젝트마다 10개를 통째로 복사할 필요 없이, 바뀌는 부분만 오버라이드하면 된다.

## 원본(마스터) 보관

`YLIA_Corp/Antigravity_AI팀_에이전트` 폴더는 팀의 원본(마스터) 템플릿으로 유지한다. 전역 설정이나 특정 프로젝트에서 구조적으로 좋은 변경을 발견하면, 그 내용을 이 마스터 폴더에도 반영해서 다음 프로젝트에 그대로 이어지게 한다.

## 사용 방법

Claude Code 안에서 자연어로 요청하면 자동으로 적절한 에이전트가 호출된다 (description에 트리거 조건을 적어뒀기 때문). 특정 역할을 직접 지정하고 싶으면:

```
@product-manager 이 기능 PRD 써줘
@developer 로그인 API 구현해줘
@qa-reviewer 방금 짠 코드 리뷰해줘
```

## 팀 협업 흐름 (권장)

**제품/기능 개발 트랙**
```
researcher → product-manager / product-planner → ceo-advisor(승인)
                ↓
        service-planner ←→ ui-ux-designer ←→ ux-writer
                ↓
        privacy-security-officer (개인정보 다루는 기능이면 필수 점검)
                ↓
        project-manager (작업 분배/일정)
                ↓
        web-app-publisher (디자인 → 마크업)
                ↓
        backend-developer (API/DB) ←→ frontend-developer (웹) / mobile-app-developer (iOS·Android)
                ↓
           qa-reviewer
```

웹 화면은 frontend-developer, 앱 화면(iOS/Android, 네이티브·하이브리드·RN·Flutter)은 mobile-app-developer가 담당하고, 둘 다 backend-developer의 동일한 API 계약을 공유한다.

**브랜드/판매 트랙**
```
logo-designer (BI/브랜드 아이덴티티)
        ↓
product-planner (상품/요금제 구성) → product-detail-designer (상세페이지) ←→ ux-writer
        ↓
     marketer (런칭 전략/채널) — 런칭 시점에 전체 트랙과 합류
```

**콘텐츠/영상 트랙**
```
marketer (캠페인 목적/타겟) → video-scriptwriter (기획/대본) → video-editor (편집 디렉션/제목·썸네일)
                                                                        ↓
                                                              sns-marketer (채널별 배포/캡션/커뮤니티)
```

기능/상품/콘텐츠 하나를 진행할 때 이 순서대로 각 에이전트를 순차 호출하면, 기획 → 설계 → 개발 → 검증 → 런칭 → 배포까지 한 팀처럼 이어진다.

## 프로젝트 루트 CLAUDE.md에 추가하면 좋은 것

```markdown
## 기본 기술 스택
Next.js(TypeScript) + Tailwind CSS + uipro-cli / Supabase / Google Sheets+Apps Script+Google Forms(경량 내부 자동화) / AWS Amplify(배포)
자세한 내용은 TECH_STACK.md 참조.

## AI팀 운영 원칙
- 새 기능은 product-manager/product-planner의 기획 없이 바로 구현하지 않는다.
- 화면이 있는 기능은 service-planner → ui-ux-designer 순으로 스펙을 먼저 만든다.
- 개인정보(이름/연락처/결제/민감정보)를 다루는 기능은 privacy-security-officer 점검 없이 배포하지 않는다.
- backend-developer는 API 계약(요청/응답/에러)을 먼저 정하고 frontend-developer와 공유한 뒤 구현한다.
- backend-developer/frontend-developer/mobile-app-developer가 작성한 코드는 qa-reviewer 리뷰 없이 배포하지 않는다.
- 앱 기기 권한(카메라, 위치, 알림 등)을 요청하는 기능은 privacy-security-officer 검토를 거친다.
- 방향이 애매한 결정은 ceo-advisor에게 승인을 받는다.
```

## 커스터마이징

- 팀 규모가 작다면 역할을 합쳐도 된다 (예: product-manager + project-manager를 하나로).
- `model:` 필드는 중요한 전략 판단(대표, PM)은 opus, 실행 위주(개발, QA)는 sonnet으로 기본 설정해뒀다. 비용/속도에 따라 조정 가능.
- `tools:` 필드로 각 에이전트가 쓸 수 있는 도구를 제한해뒀다 (예: qa-reviewer는 코드를 직접 수정하지 못하게 Edit 제외). 필요하면 조정.