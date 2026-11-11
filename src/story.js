// Modo historia: lo que pasa en cada capítulo (objetivos y escenas habladas). Por ahora, el prólogo:
//   1. (la cinemática del teléfono, que llegará: por ahora, la llamada de la secretaria en subtítulos)
//   2. Ve a la oficina del jefe → la charla con el jefe Webb (sentado en su escritorio)
//   3. Por megafonía: una patrulla urgente a Pine con la Cuarta → el jefe le manda ir a él
//   4. Ve al garaje (aquí acaba lo que hay del prólogo: «Continuará...»)
// Las frases salen como las de los aliados (G.Humans.Voice: subtítulo con el nombre y la voz, si está activa);
// mientras dura una escena, la gente de la estación no charla (G.NPCs.quiet).
// G.Story.begin(capítulo, jugador) al quitarse la pantalla negra; update(dt, jugador) cada fotograma; clear() al salir.
(function (G) {
  'use strict';

  // ---------- El objetivo en pantalla ----------
  let box = null, boxT = 0;
  function objBox() {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'st-obj';
    box.className = 'hidden';
    box.innerHTML = '<small>Objetivo</small><span class="st-oi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L21 12 L12 21 L3 12 Z" fill="none" stroke-width="2"/></svg></span><b></b>';
    document.body.appendChild(box);
    return box;
  }
  function setObj(text, label) {
    const b = objBox();
    b.querySelector('b').textContent = text;
    b.querySelector('small').textContent = label || 'Nuevo objetivo';
    b.classList.remove('hidden', 'done', 'end');
    b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    boxT = 0;
  }
  function objDone() { if (box) { box.classList.add('done'); box.querySelector('small').textContent = 'Objetivo cumplido'; boxT = 2.6; } }
  function hideObj() { if (box) box.classList.add('hidden'); boxT = 0; }

  // ---------- Quién habla ----------
  // (los que no están en la escena hablan «desde» el jugador: el teléfono, la megafonía)
  let SPK = null;
  function speakers(player) {
    const at = player.pos;
    return {
      jav: { name: 'Javier', color: '#e8d6a6', alive: true, gone: false, female: false, vIdx: 11, vp: 0.86, vr: 1.0, pos: at },
      sec: { name: 'Secretaria (teléfono)', color: '#d8b8e0', alive: true, gone: false, female: true, vIdx: 5, vp: 1.2, vr: 1.05, pos: at },
      pa: { name: 'Megafonía', color: '#c8d0d8', alive: true, gone: false, female: true, vIdx: 9, vp: 1.0, vr: 0.95, pos: at },
      jefe: (G.NPCs && G.NPCs.get('jefe')) || { name: 'Jefe Webb', color: '#e8c89a', alive: true, gone: false, female: false, vIdx: 2, vp: 0.8, vr: 0.95, pos: { x: 29.95, z: 21.2 } }
    };
  }

  // ---------- Las escenas del prólogo ----------
  const CALL = [
    ['sec', 'Javier, soy Linda. El jefe Webb quiere verte en su oficina. Dice que ahora, si puedes.'],
    ['jav', 'Voy para allá.']
  ];
  const TALK = [
    ['jefe', 'Pasa, Javier. Siéntate si quieres... bueno, como prefieras.'],
    ['jefe', 'Veinte años y ya con la estrella de sheriff. Tienes suerte, chico. Mucha.'],
    ['jav', 'Suerte, o que nadie más quería el puesto, jefe.'],
    ['jefe', 'Un poco de las dos. Yo entré en el cuerpo más o menos con tu edad. Turno de noche en Rainier Valley: ahí se aprende rápido o no se aprende.'],
    ['jefe', 'Bueno, al grano. ¿Cómo va lo del muelle 66?'],
    ['jav', 'Cerrado. Los dos detenidos están abajo, en los calabozos. El informe lo tienes en la bandeja.'],
    ['jefe', 'Lo vi. Bien escrito, por cierto. ¿Y el que trajeron anoche? Dicen que no para de gritar.'],
    ['jav', 'Tiene fiebre alta y se ha mordido la mano. Pedí un médico, pero de Harborview no mandan a nadie.'],
    ['jefe', 'Harborview no da abasto. Lo de esta semana no es normal, Javier: agresiones, mordiscos, gente que no siente los golpes...'],
    ['jav', '¿Drogas?'],
    ['jefe', 'Eso dicen los de arriba. Yo llevo treinta años en esto y nunca había visto nada igual.'],
    ['jefe', 'Con media plantilla de baja vas a tener que doblar turnos. Fírmame aquí los horarios.'],
    ['jav', 'Hecho.'],
    ['jefe', 'Y una cosa más: ahí fuera, nada de heroísmos. Si algo no te cuadra, pides apoyo y esperas.']
  ];
  const PA = [
    ['pa', 'Atención, unidades disponibles: se necesita una patrulla urgente en la calle Pine, a la altura de la Cuarta avenida. Varias llamadas por agresiones. Hay heridos.'],
    ['pa', 'Repito: patrulla urgente a Pine con la Cuarta.']
  ];
  const AFTER = [
    ['jefe', '... Lo que te decía. Reyes está con la sesión del turno, y Ortiz y Brennan no llegan a tiempo.'],
    ['jefe', 'Coge un patrullero del garaje y ve tú. Y Javier... ten cuidado.'],
    ['jav', 'Voy.']
  ];
  // dónde: la oficina del jefe (la armería de la estación abandonada) y el garaje
  const OFFICE = { x0: 24.3, x1: 31.7, z0: 17.3, z1: 24.7 }, GARAGE = { x0: 36, x1: 60, z0: 1, z1: 15 };
  const inRect = (p, r) => p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1;

  // ---------- Una escena: las frases una detrás de otra ----------
  // near: quién tiene que estar cerca para que siga (si Javier se va, la charla espera a que vuelva)
  let scene = null;
  function play(list, done, near) { scene = { list, i: 0, t: 0.4, done, near: near || null }; }
  function stepScene(dt, player) {
    const s = scene, V = G.Humans && G.Humans.Voice;
    if (!s || !V) return;
    if (s.near && Math.hypot(player.pos.x - s.near.pos.x, player.pos.z - s.near.pos.z) > 6.5) return;
    s.t -= dt;
    if (s.t > 0) return;
    if (s.i >= s.list.length) { scene = null; if (s.done) s.done(); return; }
    const [who, text] = s.list[s.i++];
    const h = SPK[who];
    V.say(h, text, { prio: 3, force: true });
    s.t = 0.9 + text.length * 0.058 + 0.55;
    // el jefe, mientras le toca hablar, gesticula
    if (SPK.jefe && SPK.jefe.def) SPK.jefe.pose = who === 'jefe' ? 'sittalk' : 'desk';
  }

  // ---------- El capítulo ----------
  let step = null, waitT = 0;
  // (al empezar una escena, la charla de fondo que estaba en cola se descarta: no se cuela entre las frases)
  const quiet = (on) => {
    if (G.NPCs) G.NPCs.quiet = on;
    const V = G.Humans && G.Humans.Voice;
    if (on && V && V.q) V.q = V.q.filter((it) => it.prio >= 3);
  };
  const Story = {
    get step() { return step; },
    begin(ch, player) {
      this.clear();
      if (ch !== 'prologo' || !player) return;
      SPK = speakers(player);
      step = 'call'; waitT = 1.6;
      quiet(true);
    },
    clear() {
      step = null; scene = null; SPK = null; waitT = 0;
      hideObj();
      quiet(false);
    },
    update(dt, player) {
      if (!step || !player) return;
      if (boxT > 0) { boxT -= dt; if (boxT <= 0 && box && box.classList.contains('done')) hideObj(); }
      if (scene) { stepScene(dt, player); return; }
      if (waitT > 0) { waitT -= dt; return; }
      if (step === 'call') {
        // (aquí irá la cinemática: Javier en su despacho, suena el teléfono)
        step = 'calling';
        play(CALL, () => { quiet(false); setObj('Ve a la oficina del jefe'); step = 'go'; });
      } else if (step === 'go') {
        if (inRect(player.pos, OFFICE)) {
          objDone(); quiet(true); step = 'talk';
          play(TALK, () => { step = 'pa'; waitT = 1.0; }, SPK.jefe);
        }
      } else if (step === 'pa') {
        step = 'announce';
        play(PA, () => play(AFTER, () => {
          if (SPK.jefe && SPK.jefe.def) SPK.jefe.pose = 'desk';
          quiet(false); setObj('Ve al garaje'); step = 'garage';
        }));
      } else if (step === 'garage') {
        if (inRect(player.pos, GARAGE)) {
          objDone(); step = 'end'; waitT = 2.8;
        }
      } else if (step === 'end') {
        // (lo que hay del prólogo acaba aquí)
        setObj('Continuará...', 'Prólogo');
        if (box) box.classList.add('end');
        step = 'over';
      }
    }
  };
  G.Story = Story;
})(window.Game = window.Game || {});
