<template>
  <main class="landing tw:min-h-screen tw:px-6 tw:py-8 tw:sm:px-10">
    <div
      class="landing__top tw:mx-auto tw:flex tw:max-w-6xl tw:items-center tw:justify-between"
    >
      <a class="wordmark" href="#inicio" aria-label="Starter Kit, início">
        <span class="wordmark__mark" aria-hidden="true">S</span>
        <span>starter<span class="wordmark__light">kit</span></span>
      </a>
      <span class="status-note"
        ><span aria-hidden="true"></span> Base pronta para começar</span
      >
    </div>

    <section
      id="inicio"
      class="hero tw:mx-auto tw:grid tw:max-w-6xl tw:items-center tw:gap-12 tw:lg:grid-cols-[1.15fr_0.85fr]"
    >
      <div class="hero__copy">
        <p class="eyebrow">UM BOM COMEÇO, SEM RUÍDO</p>
        <h1>Seu próximo<br />projeto começa <em>bem.</em></h1>
        <p class="hero__summary">
          Um espaço simples e cuidadoso para construir o que vem a seguir. A
          estrutura está pronta; o produto começa com você.
        </p>
        <a class="hero__link" href="#sobre">
          Conheça este espaço
          <q-icon name="arrow_forward" size="18px" aria-hidden="true" />
        </a>
      </div>

      <aside class="note-card" aria-label="Informação sobre esta página">
        <div class="note-card__top">
          <span class="note-card__icon"
            ><q-icon name="auto_awesome" aria-hidden="true" /></span
          ><span class="note-card__index">01 / 01</span>
        </div>
        <div class="note-card__rule"></div>
        <p class="note-card__label">PONTO DE PARTIDA</p>
        <h2>Feito para<br />evoluir com clareza.</h2>
        <p class="note-card__body">
          Esta página é uma base pública. Nenhuma conta ou dado pessoal é
          necessário para explorá-la.
        </p>
        <div class="note-card__foot">
          <span aria-hidden="true">✳</span> Aberto para novas ideias
        </div>
      </aside>
    </section>

    <footer
      id="sobre"
      class="landing__footer tw:mx-auto tw:flex tw:max-w-6xl tw:items-center tw:justify-between"
    >
      <span>Uma fundação para o que importa.</span>
      <span>Starter Kit <span aria-hidden="true">·</span> 2026</span>
    </footer>
  </main>
</template>

<style scoped>
.landing {
  --ink: #252a25;
  --muted: #73766e;
  --accent: #456b56;
  position: relative;
  overflow: hidden;
  background: #f4f2ec;
  color: var(--ink);
  font-family: "DM Sans", sans-serif;
}

.landing::before {
  position: absolute;
  inset: 0 0 auto;
  height: 52%;
  background: radial-gradient(
    ellipse at 83% 52%,
    rgb(214 222 202 / 40%),
    transparent 52%
  );
  content: "";
  pointer-events: none;
}

.landing__top,
.hero,
.landing__footer {
  position: relative;
}
.landing__top {
  min-height: 54px;
}
.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.8px;
  text-decoration: none;
}
.wordmark__mark {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border-radius: 10px 10px 10px 3px;
  background: var(--accent);
  color: white;
  font-family: Georgia, serif;
  font-size: 19px;
  font-weight: 400;
}
.wordmark__light {
  color: var(--accent);
  font-weight: 400;
}
.status-note {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #5e685e;
  font-size: 12px;
}
.status-note span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #779774;
  box-shadow: 0 0 0 4px rgb(119 151 116 / 12%);
}
.hero {
  min-height: min(690px, calc(100svh - 138px));
  padding-block: 66px;
}
.hero__copy {
  padding-block: 28px;
  animation: arrive 650ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
.eyebrow,
.note-card__label {
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
}
.hero h1 {
  margin: 25px 0 22px;
  font-family: "DM Serif Display", Georgia, serif;
  font-size: clamp(54px, 7.2vw, 91px);
  font-weight: 400;
  letter-spacing: -3.7px;
  line-height: 0.99;
}
.hero h1 em {
  color: var(--accent);
  font-weight: 400;
}
.hero__summary {
  max-width: 410px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.85;
}
.hero__link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 23px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: gap 180ms ease;
}
.hero__link:hover {
  gap: 15px;
}
.hero__link:focus-visible,
.wordmark:focus-visible {
  outline: 3px solid #71987a;
  outline-offset: 5px;
  border-radius: 3px;
}
.note-card {
  justify-self: end;
  width: min(100%, 366px);
  min-height: 372px;
  padding: 30px;
  border: 1px solid rgb(58 77 60 / 9%);
  border-radius: 4px 28px 4px 4px;
  background: rgb(255 255 252 / 72%);
  box-shadow: 0 26px 70px rgb(39 49 39 / 8%);
  animation: arrive 650ms 100ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
.note-card__top,
.note-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.note-card__icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  background: #edf0e8;
  color: var(--accent);
  font-size: 18px;
}
.note-card__index {
  color: #9b9d94;
  font-size: 10px;
  letter-spacing: 1px;
}
.note-card__rule {
  height: 1px;
  margin: 28px 0 24px;
  background: #e8e8df;
}
.note-card__label {
  font-size: 9px;
}
.note-card h2 {
  margin: 12px 0;
  font-family: "DM Serif Display", Georgia, serif;
  font-size: 31px;
  font-weight: 400;
  letter-spacing: -0.7px;
  line-height: 1.18;
}
.note-card__body {
  max-width: 265px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}
.note-card__foot {
  justify-content: flex-start;
  gap: 9px;
  margin-top: 27px;
  color: #777d70;
  font-size: 10px;
}
.note-card__foot span {
  color: var(--accent);
  font-size: 17px;
}
.landing__footer {
  min-height: 55px;
  border-top: 1px solid rgb(60 70 58 / 12%);
  color: #85877e;
  font-size: 10px;
  letter-spacing: 0.15px;
}
.landing__footer span span {
  padding-inline: 5px;
  color: #a2aa97;
}
@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(13px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 640px) {
  .hero {
    min-height: auto;
    gap: 24px;
    padding-block: 64px 48px;
  }
  .hero h1 {
    font-size: clamp(52px, 14vw, 72px);
    letter-spacing: -2.5px;
  }
  .note-card {
    justify-self: stretch;
    min-height: auto;
    padding: 24px;
  }
  .landing__footer {
    gap: 12px;
    font-size: 9px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .landing {
    scroll-behavior: auto;
  }

  .hero__copy,
  .note-card {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }

  .hero__link {
    transition-duration: 0.01ms;
  }
}
</style>
