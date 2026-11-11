// Gente de fondo del modo historia: policías y civiles con rutinas sencillas (sentados en su escritorio, en el
// mostrador, hablando por teléfono, en el lavabo, caminando de una sala a otra...). No pelean ni se asustan: son
// el decorado vivo de un capítulo. Saludan a Javier cuando pasa cerca, charlan entre ellos y la radio de la sala
// suena con interferencias (y lo que dice va cambiando: el primer día).
// G.NPCs.setup('prologo', scene) los pone; clear() los quita; update(dt, player) cada fotograma.
(function (G) {
  'use strict';
  const U = G.Util;
  const SKINS = [0xd2a07a, 0xc08a64, 0x9c6b4a, 0xe0b294, 0x7a5236, 0xb88262, 0xcf9c78, 0x5e3e2a];
  const HAIRS = [0x2a1d14, 0x3a2a1c, 0x5a4630, 0x1a1715, 0x6e5232, 0x8a7a66, 0xa8a49a];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const R = (a, b) => a + Math.random() * (b - a);
  const NPC_R = 0.27, PL_R = 0.28;

  // ---------- Cómo van vestidos ----------
  // pol: uniforme azul marino (alguno con la camisa celeste, la gorra o el chaleco); det: detective, de paisano con
  // la placa al cinto; civ: ropa de calle; preso: el mono naranja; mec: mono de trabajo del taller
  function lookOf(kind, fem) {
    const o = { hero: true, npc: true, noBand: true, female: !!fem, skin: pick(SKINS), hair: pick(HAIRS), shoes: 0x1a1612, lips: fem ? 0xa8645a : 0x9a6656,
      longSleeves: true, pocket: true, seed: Math.floor(Math.random() * 1e9), gear: {} };
    const g = o.gear;
    if (!fem && Math.random() < 0.35) o.beard = U.shade(o.hair, 1.1);
    if (fem && Math.random() < 0.6) o.ponytail = true;
    if (kind === 'pol') {
      o.shirt = Math.random() < 0.7 ? 0x26324a : 0x7a92b0; o.pants = 0x1a2030; o.shoes = 0x101010; o.belt = 0x111111; o.collar = true;
      if (Math.random() < 0.4) g.cap = 0x1c2434;
      if (Math.random() < 0.3) g.vest = 0x2a2e34;
    } else if (kind === 'det') {
      o.shirt = pick([0xd8d4ca, 0x9aa8b8, 0xc8bca0]); o.pants = pick([0x2a2e34, 0x3a3428, 0x262a30]); o.belt = 0x2a2018; o.collar = true;
      if (Math.random() < 0.5) g.jacket = pick([0x3a3e44, 0x4a3e32, 0x2a3040]);
    } else if (kind === 'jefe') {
      // el jefe: canoso, camisa blanca de mando con corbata oscura (el cuello) y pantalón azul marino
      o.hair = pick([0xa8a49a, 0x8a8a84, 0xc8c4ba]); o.beard = Math.random() < 0.5 ? U.shade(o.hair, 1.05) : undefined;
      o.shirt = 0xe8e6e0; o.pants = 0x1a2030; o.shoes = 0x101010; o.belt = 0x111111; o.collar = true;
    } else if (kind === 'preso') {
      o.shirt = 0xd0702a; o.pants = 0xc8682a; o.shoes = 0xd8d4c8; o.longSleeves = false;
    } else if (kind === 'mec') {
      o.shirt = 0x3e4a5a; o.pants = 0x3e4a5a; o.longSleeves = false; g.gloves = 0x2a2a2a;
    } else {
      o.shirt = pick([0x8a2a2a, 0x2a5a3a, 0xc8b898, 0x4a5a7a, 0x6a4a6a, 0xd8d0c0, 0x3a3a3a, 0xa8743a]);
      o.pants = pick([0x2a3448, 0x3a3a3a, 0x5a4a3a, 0x6a6a6a, 0x26303e]);
      o.shoes = pick([0x2a2620, 0xd8d4cc, 0x4a3a2a]);
      o.longSleeves = Math.random() < 0.6;
      if (Math.random() < 0.45) g.jacket = pick([0x3a4a62, 0x5a3a2a, 0x2a2a2a, 0x6a6250, 0x7a2a2a]);
      if (Math.random() < 0.2) g.beanie = pick([0x3a3a3a, 0x8a2a2a, 0x2a4a6a]);
    }
    return o;
  }

  // ---------- Quiénes hay en cada capítulo ----------
  // at: dónde se quedan [x, z, mirando (rad), pose] · route: puntos [x, z, espera (s), mirando, pose] (en bucle)
  // pose: sit, desk, phone, talk, wash, bars o nada (de pie). talk: con quién charla (clave de CONVOS). greet: saluda
  const PI = Math.PI, N = PI, S = 0, E = PI / 2, Wd = -PI / 2;
  const ROSTER = {
    prologo: [
      // recepción: la agente del mostrador atiende a un civil; otro espera su turno; otra, sentada en el banco
      { name: 'Okafor', kind: 'pol', fem: true, at: [16.3, 26.72, S, 'talk'], greet: true, talk: 'recepcion' },
      { name: 'Señor', kind: 'civ', at: [15.2, 28.62, N, 'talk'], talk: 'recepcion' },
      { name: 'Mujer', kind: 'civ', fem: true, at: [17.9, 28.75, N, null] },
      { name: 'Chico', kind: 'civ', at: [22.6, 31.36, N, 'sit'] },
      // vestíbulo: esperando en los bancos
      { name: 'Señora', kind: 'civ', fem: true, at: [12.46, 37.2, E, 'sit'] },
      // oficinas: escribiendo en sus escritorios, un detective al teléfono y un civil poniendo una denuncia
      { name: 'Haskins', kind: 'det', at: [11.8, 49.08, N, 'desk'], greet: true, talk: 'denuncia' },
      { name: 'Vecino', kind: 'civ', at: [11.75, 47.55, S, 'talk'], talk: 'denuncia' },
      { name: 'Lee', kind: 'pol', fem: true, at: [15.8, 53.08, N, 'desk'], greet: true },
      { name: 'Dawson', kind: 'pol', at: [7.8, 57.08, N, 'desk'], greet: true },
      { name: 'Moreno', kind: 'det', at: [3.4, 60.5, N, 'phone'], greet: true, talk: 'telefono' },
      // sala de radio: el operador
      { name: 'Central', kind: 'pol', at: [7.0, 34.58, N, 'desk'], greet: true, talk: 'central' },
      // aseos: dos agentes en los lavabos
      { name: 'Price', kind: 'pol', at: [27.0, 26.02, N, 'wash'], greet: true, talk: 'aseos' },
      { name: 'Vance', kind: 'pol', at: [29.0, 26.02, N, null], greet: true, talk: 'aseos' },
      // garaje: el mecánico, metido en el motor de un patrullero
      { name: 'Hale', kind: 'mec', at: [48.86, 6.6, Wd, 'wash'], greet: true },
      // sala principal, junto a la radio: dos agentes en los sillones (oyendo la radio y comentando)
      { name: 'Brooks', kind: 'pol', at: [13.5, 9.86, S, 'sit'], greet: true, talk: 'sala' },
      { name: 'Kowalski', kind: 'pol', at: [11.06, 14.1, E, 'sit'], greet: true, talk: 'sala' },
      // sala de reuniones: la sargento da la sesión de la mañana; dos agentes la escuchan sentados
      { name: 'Sargento Reyes', kind: 'pol', fem: true, at: [46.6, 60.9, N, 'talk'], greet: true, talk: 'reunion' },
      { name: 'Tran', kind: 'pol', at: [43.6, 57.02, S, 'sit'] },
      { name: 'Walsh', kind: 'pol', fem: true, at: [48.4, 57.02, S, 'sit'] },
      // calabozos: uno agarrado a los barrotes, más agresivo de lo normal (los sacude, grita: tiene fiebre...); en
      // la celda de al lado, otro preso, tranquilo, que no le quita ojo
      { name: 'Detenido', kind: 'preso', at: [3.86, 25.8, E, 'bars'], rage: true },
      { name: 'Preso', kind: 'preso', at: [3.3, 29.3, E, null], talk: 'preso' },
      // la oficina del jefe (la armería de la estación abandonada): sentado en su escritorio, mirando a la puerta
      { name: 'Jefe Webb', kind: 'jefe', at: [29.95, 21.2, Wd, 'desk'], id: 'jefe' },
      // sala de descanso: una agente en la nevera
      { name: 'Fischer', kind: 'pol', fem: true, at: [48.8, 30.2, Wd, 'wash'], greet: true },
      // ---- los que van de un lado a otro ----
      { name: 'Brennan', kind: 'pol', greet: true, route: [[19.0, 15.0, 2], [17.0, 36.0, 1], [12.0, 51.0, 3, E], [17.0, 40.0, 0], [19.5, 20.0, 1], [34.0, 20.0, 0], [43.0, 22.0, 3, Wd], [34.0, 8.0, 0]] },
      { name: 'Ortiz', kind: 'pol', greet: true, route: [[54.0, 12.0, 3, E], [34.0, 4.0, 0], [34.0, 28.0, 0], [28.0, 28.6, 2, N], [34.0, 29.0, 0], [42.0, 20.0, 2], [40.0, 50.0, 2, S], [52.0, 38.0, 2], [34.0, 26.0, 0]] },
      { name: 'Novak', kind: 'det', greet: true, route: [[3.8, 8.3, 5, N, 'wash'], [19.0, 12.0, 0], [20.0, 24.5, 3, S], [14.0, 46.0, 2], [21.0, 58.0, 4, E, 'wash'], [17.0, 38.0, 0]] },
      { name: 'Visitante', kind: 'civ', fem: true, route: [[8.0, 65.6, 4, S], [8.0, 59.0, 0], [16.0, 40.0, 0], [19.8, 29.4, 9, N], [16.0, 40.0, 0], [8.0, 59.0, 0]] }
    ]
  };

  // ---------- Lo que dicen ----------
  const GREET = ['Buenas noches, Javier.', 'Javier.', 'Buenas noches, sheriff.', '¿Qué tal, Javier?', 'Sheriff.', 'Noche movida, ¿eh, Javier?', 'Buenas, Javier.', 'Javier, hay café recién hecho en la sala.',
    'Sheriff... todavía se me hace raro llamarte así, chaval.', 'Buenas noches, jefe... perdón, sheriff. Es que eres tan joven que me lío.'];
  const GREET_CIV = ['Buenas noches.', 'Buenas noches, agente.'];
  // charlas: [quién (índice en el grupo, por orden de la lista), lo que dice]; se repiten de vez en cuando
  const CONVOS = {
    recepcion: [[[1, 'Me robaron el coche delante de casa. A plena luz del día.'], [0, 'Necesito la matrícula y que me firme aquí, por favor.'], [1, '¿Y cuándo lo van a buscar?'], [0, 'Hoy andamos cortos de patrullas, señor. Haremos lo que podamos.']],
      [[1, '¿Tardará mucho? Tengo el coche mal aparcado.'], [0, 'Dos minutos. Firme aquí y aquí.']]],
    denuncia: [[[1, 'Le digo que mi vecino no está bien. Anoche aullaba en el jardín.'], [0, '¿Aullaba?'], [1, 'Como un perro. Y esta mañana no abre la puerta.'], [0, 'Mandaré a alguien cuando quede una patrulla libre.']]],
    telefono: [[[0, 'Sí, señora... No, señora, eso no es una emergencia.'], [0, '... ¿Mordido? ¿Por su marido?'], [0, 'Señora, cuelgue y llame al 911. Ahora mismo.']],
      [[0, 'Moreno, homicidios... No, hoy no puedo, tenemos medio turno de baja.']]],
    central: [[[0, 'Unidad catorce, repita la dirección.'], [0, 'Central a todas las unidades: mantengan la frecuencia despejada.']]],
    aseos: [[[0, 'Mi mujer tiene fiebre desde el sábado. Dice que es la gripe esa.'], [1, 'La mitad del turno de noche está igual.'], [0, 'Pues como esto siga, no quedamos ni para el café.']],
      [[1, 'El chaval de la estrella... ¿cuántos años tiene? ¿Veintiuno?'], [0, 'Veinte. Y firma los informes mejor que el anterior.'], [1, 'A su edad yo todavía vivía con mi madre.']],
      [[0, '¿Te enteraste de lo de Capitol Hill? A un repartidor le arrancaron media cara de un mordisco.'], [1, 'Drogas. Esa porquería nueva que corre por el puerto.'], [0, 'Ojalá.']]],
    sala: [[[0, '¿Escuchaste la radio? Otra vez Harborview.'], [1, 'La gripe esa. Mi cuñada dice que el hospital está lleno.'], [0, 'Lleno no. Desbordado.'], [1, 'Ya pasará. Siempre pasa.']],
      [[1, 'Dicen que en Tacoma cerraron dos colegios.'], [0, 'Mientras no cierren el café de abajo...']],
      [[0, 'Javier ya está en su despacho. Hoy le toca firmar los informes.'], [1, 'Pobre.']],
      [[0, '¿Sabías que Javier tiene veinte años? Veinte. Y ya es sheriff.'], [1, 'Mi hijo tiene su edad y no sabe ni freír un huevo.'], [0, 'Pues el chico se lo ha ganado. Lo del tiroteo del muelle lo resolvió él solo.']],
      [[1, 'Tres llamadas por agresiones en una hora. Todas en Belltown.'], [0, 'Y en todas, lo mismo: el agresor muerde.'], [1, 'Dicen que al de la Tercera le metieron dos balas en el pecho y siguió caminando.'], [0, 'Dicen muchas cosas.']]],
    reunion: [[[0, 'Turno de noche: hay cortes en la Quinta y en Pike, y tres avisos por agresiones en Belltown.'], [0, 'Y lo de los mordiscos no es una forma de hablar: guantes y distancia.'], [0, 'Nada de héroes. Se espera el apoyo.'], [0, '¿Preguntas? ... ¿Nadie? Bien.']]],
    preso: [[[0, 'Agente... ese de al lado no está bien. Lleva así toda la noche.'], [0, 'Se ha mordido la mano. Se la ha mordido él solo, ¿sabe?']],
      [[0, '¿Cuándo me sacan de aquí? Yo solo me peleé en un bar.'], [0, 'Pónganme en otra celda. Por favor.']], [[0, 'Algo está pasando ahí fuera. Lo oí por la radio del guardia.']]]
  };
  // la radio: primero lo de siempre; después, cada vez más raro
  const RADIO = [
    '... unidad nueve, control de tráfico en la Quinta, cambio...',
    '... Central, el sospechoso del robo ya está en custodia...',
    '... recibido, nueve. Vuelva a patrullar...',
    '... reportan una pelea en la Tercera con Pike. Varios heridos...',
    '... agresión en Capitol Hill, calle Pine. La víctima tiene mordeduras en el cuello...',
    '... tres llamadas por ataques en Belltown, se piden refuerzos...',
    '... ambulancias desbordadas en Harborview, piden apoyo en la entrada...',
    '... un sujeto agresivo... repito, muerde a los transeúntes...',
    '... todas las unidades disponibles, al centro...',
    '... negativo, Central, no quedan patrullas libres...',
    '... ¿Central? ... Central, responda...'
  ];
  // el preso agresivo: cuando Javier se acerca (o de vez en cuando), sacude los barrotes y grita
  const RAGE = ['¡Sácame de aquí! ¡Me arde! ¡Me arde todo!', '¡Ven! ¡Ven aquí! ¡Más cerca!', 'Tengo hambre... tengo mucha hambre...', '¡¿Qué miras?! ¡¿QUÉ MIRAS?!', '¡Abre! ¡ABRE LA PUERTA!', 'Huele... hueles muy bien...'];
  const COLORS = ['#9fc2e8', '#c8d8a0', '#e8c89a', '#d8a8c8', '#a8d8d0', '#e8a8a0'];

  // ---------- Una persona ----------
  class NPC {
    constructor(def, scene, i) {
      this.def = def; this.name = def.name; this.kind = def.kind; this.female = !!def.fem;
      this.look = lookOf(def.kind, def.fem);
      this.model = G.Models.createHumanoid(this.look);
      G.Models.setWeapon(this.model, null);
      scene.add(this.model.root);
      const a = def.at || def.route[0];
      this.pos = { x: a[0], z: a[1] }; this.lv = 0;
      this.y = G.World.groundY(a[0], a[1], 0);
      this.facing = def.at ? a[2] : 0;
      this.route = def.route || null; this.ri = 0; this.wait = def.route ? R(0, 2) : Infinity;
      this.pose = def.at ? a[3] || null : null; this.poseK = this.pose ? 1 : 0; this.lastPose = this.pose;
      this.phase = Math.random() * 10; this.moveAmt = 0; this.speedNow = 0; this.time = Math.random() * 50;
      this.path = null; this.stuck = 0; this.chk = { x: this.pos.x, z: this.pos.z, t: 0 };
      this.alive = true; this.gone = false;
      this.color = COLORS[i % COLORS.length];
      this.vIdx = i; this.vp = this.female ? R(1.1, 1.3) : R(0.82, 1.02); this.vr = R(0.95, 1.08);
      this.greetT = -999; this.frame = i;
      if (this.route) this.go(this.route[0]);
    }
    // hacia un punto de la ruta (con A* si no se ve en línea recta)
    go(p) {
      const W = G.World;
      this.goal = { x: p[0], z: p[1] };
      this.path = W.hasClearLine(this.pos.x, this.pos.z, p[0], p[1], 0) ? null : W.findPath(this.pos.x, this.pos.z, p[0], p[1], 0, 0);
      if (this.path && this.path.length > 2) {
        let k = 0;
        for (let j = Math.min(this.path.length - 1, 6); j >= 1; j--) if (W.hasClearLine(this.pos.x, this.pos.z, this.path[j].x, this.path[j].z, 0)) { k = j; break; }
        if (k > 0) this.path.splice(0, k);
      }
      this.pose = null;
    }
    update(dt, player, others) {
      const W = G.World;
      this.time += dt;
      let v = 0;
      if (this.route && this.wait <= 0) {
        // caminando: al siguiente punto del camino; si alguien se le pone delante (el jugador), espera
        const pt = this.path && this.path.length ? this.path[0] : this.goal;
        const dx = pt.x - this.pos.x, dz = pt.z - this.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.35) {
          if (this.path && this.path.length) this.path.shift();
          else {
            const p = this.route[this.ri];
            this.wait = p[2] || 0;
            if (p[3] != null) this.faceTo = p[3];
            this.pose = p[4] || null;
            this.ri = (this.ri + 1) % this.route.length;
          }
        } else {
          let block = false;
          if (player && !player.dead) {
            const px = player.pos.x - this.pos.x, pz = player.pos.z - this.pos.z, pd = Math.hypot(px, pz);
            if (pd < 1.15 && (px * dx + pz * dz) / (pd * d + 1e-6) > 0.55) block = true;
          }
          if (!block) {
            const sp = 1.25, st = Math.min(d, sp * dt);
            const ox = this.pos.x, oz = this.pos.z;
            W.move(this.pos, dx / d * st, dz / d * st, NPC_R, 0, 0);
            v = Math.hypot(this.pos.x - ox, this.pos.z - oz) / Math.max(1e-4, dt);
            const want = Math.atan2(dx, dz);
            this.facing = U.turnToward(this.facing, want, dt * 7);
          }
          // atascado: vuelve a calcular el camino; si sigue, pasa al siguiente punto
          this.chk.t += dt;
          if (this.chk.t > 1.6) {
            if (Math.hypot(this.pos.x - this.chk.x, this.pos.z - this.chk.z) < 0.15 && !block) {
              this.stuck++;
              if (this.stuck > 2) { this.stuck = 0; this.ri = (this.ri + 1) % this.route.length; }
              this.go(this.route[this.ri]);
            } else this.stuck = 0;
            this.chk.x = this.pos.x; this.chk.z = this.pos.z; this.chk.t = 0;
          }
        }
      } else if (this.route) {
        this.wait -= dt;
        if (this.faceTo != null) this.facing = U.turnToward(this.facing, this.faceTo, dt * 4);
        if (this.wait <= 0) { this.faceTo = null; this.go(this.route[this.ri]); }
      }
      this.speedNow = v;
      this.moveAmt += (Math.min(1, v / 2.0) - this.moveAmt) * Math.min(1, dt * 10);
      this.phase += dt * PI * 2 * (0.62 + 0.21 * Math.min(6, v)) * (this.moveAmt > 0.05 ? 1 : 0);
      // el preso agresivo: sacude los barrotes a ratos (y siempre que Javier anda cerca)
      if (this.def.rage) {
        const near = player && Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z) < 5;
        const fit = near || (this.time % 11) < 2.6;
        this.pose = fit ? 'rage' : 'bars';
        if (fit && !this.raging && G.Audio) G.Audio.play('clang', { x: this.pos.x + 0.3, z: this.pos.z, vol: 0.55 });
        this.raging = fit;
      }
      // la pose (sentado, al teléfono...): entra y sale suave
      if (this.pose) this.lastPose = this.pose;
      this.poseK += ((this.pose ? 1 : 0) - this.poseK) * Math.min(1, dt * 4);
      // el jugador no atraviesa a la gente: lo aparta un poco (sin meterlo en una pared)
      if (player && !player.dead && !player.climb) {
        const px = player.pos.x - this.pos.x, pz = player.pos.z - this.pos.z, pd = Math.hypot(px, pz), m = NPC_R + PL_R;
        if (pd < m && pd > 1e-4) W.move(player.pos, px / pd * (m - pd), pz / pd * (m - pd), PL_R, player.lv || 0, player.elev || 0);
      }
      // los que caminan no se meten dentro de los que están quietos
      if (this.route) for (const o of others) {
        if (o === this) continue;
        const ox = this.pos.x - o.pos.x, oz = this.pos.z - o.pos.z, od = Math.hypot(ox, oz), m = NPC_R * 2;
        if (od < m && od > 1e-4) W.move(this.pos, ox / od * (m - od) * 0.6, oz / od * (m - od) * 0.6, NPC_R, 0, 0);
      }
      this.draw(dt);
    }
    draw(dt) {
      const m = this.model;
      const gy = G.World.groundY(this.pos.x, this.pos.z, 0);
      this.y += (gy - this.y) * Math.min(1, dt * 14);
      m.root.position.set(this.pos.x, this.y, this.pos.z);
      m.root.rotation.y = this.facing;
      // lejos (o en otra punta de la estación): menos detalle, sin sombra y, muy lejos, ni se dibuja
      const cp = G.Camera && G.Camera.pos;
      let d = 0;
      if (cp) {
        d = Math.hypot(cp.x - this.pos.x, cp.z - this.pos.z);
        const q = G.Quality ? G.Quality.cur : { lod: [18, 36], shadowZ: 22, animFar: 2 };
        const lv = m.lod === 1 ? (d > q.lod[0] + 1.5 ? (d > q.lod[1] + 1.5 ? -1 : 0) : 1) : (m.lod === 0 ? (d < q.lod[0] - 1.5 ? 1 : (d > q.lod[1] + 1.5 ? -1 : 0)) : (d < q.lod[1] - 1.5 ? (d < q.lod[0] - 1.5 ? 1 : 0) : -1));
        G.Models.setLOD(m, lv);
        const sh = d < q.shadowZ;
        if (m.mesh.castShadow !== sh) m.mesh.castShadow = sh;
        m.root.visible = d < 44;
        if (!m.root.visible) return;
      }
      // la pose, cada fotograma solo los de cerca; los de lejos, uno de cada pocos
      this.frame++;
      // (los quietos se mueven poco: su pose, aún menos a menudo)
      const every = this.route ? (d < 10 ? 1 : (d < 22 ? 2 : 4)) : (d < 6 ? 1 : (d < 16 ? 3 : 6));
      if (this.frame % every && this.posed) return;
      this.posed = true;
      const pdt = (dt || 0.016) * every;
      const k = U.smooth(U.clamp(this.poseK, 0, 1));
      G.Models.posePlayer(m, {
        phase: this.phase, amt: this.moveAmt, run: false, crouch: 0, prone: 0,
        rel: 0, hop: 0, cat: 'none', two: false, aim: false,
        dt: pdt, time: this.time,
        action: null, t: 0, climb: null, ledge: false, jump: false, fall: 0, land: 0,
        dodge: null, dodgeRel: 0, gun: null, pitch: 0,
        grabKnife: false, searchLow: false, side: 1, weaponCat: 'none', guard: 0,
        speed: this.speedNow, female: this.female, turn: 0, acc: 0, breath: 0, breathT: this.time * 1.6,
        look: null, alert: 0, fidget: null,
        blow: null, struggle: null, bossKill: null, cover: null, draw: null,
        npc: k > 0.01 && this.lastPose ? { kind: this.lastPose, k } : null,
        aimAt: null, contact: null
      });
    }
    dispose() {
      const m = this.model;
      if (m.root.parent) m.root.parent.remove(m.root);
      try { G.Models.disposeHumanoid(m); } catch (e) { /* nada */ }
      this.gone = true; this.alive = false;
    }
  }

  // ---------- El conjunto ----------
  let list = [], groups = {}, convoT = 6, radioI = 0, radioT = 3, greetGap = 0, radio = null;
  const NPCs = {
    get list() { return list; },
    quiet: false,          // (durante una escena: ni saludos ni charlas ni la radio)
    get(id) { return list.find((n) => n.def.id === id || n.name === id) || null; },
    // radio: dónde suena (la pone el capítulo)
    setup(id, scene, opts) {
      this.clear();
      const R0 = ROSTER[id];
      if (!R0 || !scene) return;
      list = R0.map((d, i) => new NPC(d, scene, i));
      groups = {};
      for (const n of list) if (n.def.talk) (groups[n.def.talk] = groups[n.def.talk] || []).push(n);
      radio = opts && opts.radio ? { name: 'Radio', color: '#8fb0c0', alive: true, gone: false, female: false, vIdx: 7, vp: 0.78, vr: 1.12, pos: { x: opts.radio.x, z: opts.radio.z } } : null;
      radioI = 0; radioT = 4; convoT = 7; greetGap = 0;
      if (G.Audio) G.Audio.radioAt = radio ? radio.pos : null;
    },
    clear() {
      for (const n of list) n.dispose();
      list = []; groups = {}; radio = null;
      if (G.Audio) G.Audio.radioAt = null;
    },
    update(dt, player) {
      if (!list.length) return;
      for (const n of list) n.update(dt, player, list);
      if (!player || player.dead) return;
      const V = G.Humans && G.Humans.Voice;
      if (!V) return;
      if (this.quiet) return;
      const busy = V.busyNear(player);
      // el preso agresivo grita si Javier está cerca
      for (const n of list) {
        if (!n.def.rage) continue;
        const d = Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z);
        if (d < 5.5 && n.time - (n.rageT || -99) > 9 && !busy) { n.rageT = n.time; V.say(n, pick(RAGE), { prio: 2 }); }
      }
      // saludos: los policías, a Javier, cuando pasa a su lado (cada uno, de vez en cuando)
      greetGap -= dt;
      if (greetGap <= 0 && !busy) {
        for (const n of list) {
          if (!n.def.greet && n.kind !== 'civ') continue;
          const d = Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z);
          if (d > 2.4 || n.time - n.greetT < 150) continue;
          if (n.kind === 'civ' && Math.random() > 0.3) { n.greetT = n.time; continue; }
          n.greetT = n.time; greetGap = 5;
          V.say(n, n.kind === 'civ' ? pick(GREET_CIV) : pick(GREET), { prio: 2 });
          break;
        }
      }
      // charlas: el grupo más cercano al jugador (si está a unos pasos), de vez en cuando
      convoT -= dt;
      if (convoT <= 0 && !busy) {
        let best = null, bd = 9;
        for (const k in groups) {
          const g = groups[k], d = Math.min(...g.map((n) => Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z)));
          if (d < bd) { bd = d; best = k; }
        }
        if (best) {
          const g = groups[best], c = pick(CONVOS[best] || [[]]);
          let after = 0;
          for (const [who, text] of c) { const n = g[who] || g[0]; V.say(n, text, { prio: 1, after }); after += 0.9 + text.length * 0.058 + 0.3; }
          convoT = after + R(9, 16);
        } else convoT = 3;
      }
      // la radio de la sala: si estás cerca, se oye lo que dice (entre la estática)
      if (radio) {
        radioT -= dt;
        const d = Math.hypot(radio.pos.x - player.pos.x, radio.pos.z - player.pos.z);
        if (radioT <= 0 && d < 9 && !busy) {
          V.say(radio, RADIO[Math.min(radioI, RADIO.length - 1)], { prio: 1 });
          radioI = radioI < RADIO.length - 1 ? radioI + 1 : 3 + Math.floor(Math.random() * (RADIO.length - 3));
          radioT = R(10, 17);
        } else if (radioT <= 0) radioT = 2;
      }
    }
  };
  G.NPCs = NPCs;
})(window.Game = window.Game || {});
