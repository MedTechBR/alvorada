// Conversão de "turnos" dos jogos para segundos do tempo real.
// Efeitos que nos jogos acontecem "a cada turno" (Sobras, veneno, queimadura, chuva curando…) acontecem
// a cada TURNO_S segundos. Durações em turnos viram turnos × TURNO_S.
export const TURNO_S = 3;
export const turnos = (n) => n * TURNO_S;
