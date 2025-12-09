// Algorithme simple de recommandation de formations pour les étudiants.
// Entrées principales :
// - scoresEtudiant : notes sur 0-20 par matière.
// - preferences : contraintes et souhaits de l'étudiant.
// - formations : catalogue avec prérequis, poids de matières et métadonnées.
//
// Sortie : liste triée de recommandations avec score, niveau et explications.

export type ScoresEtudiant = Record<string, number>; // notes sur 0-20

export type Preferences = {
  budgetMax: number;
  distanceMaxKm: number;
  modeSouhaite: "presentiel" | "distanciel" | "mixte" | "indifferent";
  localisation?: string;
  tagsInterets?: string[];
};

export type Formation = {
  nom: string;
  prerequis: Record<string, number>; // matière -> seuil minimum
  poids: Record<string, number>; // matière -> poids, somme ≈ 1
  cout: number;
  distanceKm: number;
  mode: "presentiel" | "distanciel" | "mixte";
  tags?: string[];
  capaciteDisponible: number;
};

export type Recommandation = {
  formation: string;
  score: number;
  niveau: "Fortement recommandé" | "Adapté" | "À renforcer";
  pointsForts: string[];
  gaps: string[];
  mode: Formation["mode"];
  cout: number;
  distanceKm: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeNote20to100 = (note: number) =>
  (clamp(note, 0, 20) / 20) * 100;

const topMatieres = (
  scores: ScoresEtudiant,
  poids: Record<string, number>,
  top: number
): string[] => {
  return Object.entries(poids)
    .sort(
      (a, b) =>
        (scores[b[0]] ?? 0) * b[1] - (scores[a[0]] ?? 0) * a[1] // échelle 0-20, ordre conservé
    )
    .slice(0, top)
    .map(([matiere]) => matiere);
};

const matieresSousSeuil = (
  scores: ScoresEtudiant,
  prerequis: Record<string, number>
): string[] =>
  Object.entries(prerequis)
    .filter(
      ([matiere, seuil]) => clamp(scores[matiere] ?? 0, 0, 20) < seuil
    )
    .map(([matiere]) => matiere);

export const recommanderFormations = (
  scoresEtudiant: ScoresEtudiant,
  preferences: Preferences,
  formations: Formation[]
): Recommandation[] => {
  const recommandations: Recommandation[] = [];

  for (const formation of formations) {
    // 1) Filtrage dur
    if (formation.capaciteDisponible <= 0) continue;
    if (formation.cout > preferences.budgetMax) continue;
    if (formation.distanceKm > preferences.distanceMaxKm) continue;

    // 2) Score de compétences pondéré
    let scoreCompetences = 0;
    for (const [matiere, poids] of Object.entries(formation.poids)) {
      const note = scoresEtudiant[matiere] ?? 0; // sur 0-20
      const noteNormalisee = normalizeNote20to100(note); // converti en 0-100
      scoreCompetences += noteNormalisee * poids; // pondération sur base 100
    }

    // 3) Bonus / malus selon préférences + pénalité prérequis
    let bonus = 0;
    let malus = 0;
    let prereqPenalty = 0;

    for (const [matiere, seuil] of Object.entries(formation.prerequis)) {
      const note = clamp(scoresEtudiant[matiere] ?? 0, 0, 20);
      if (note < seuil) {
        const deficitRatio = (seuil - note) / Math.max(seuil, 1);
        prereqPenalty += deficitRatio * 15; // pénalité max 15 pts par matière manquante
      }
    }

    if (formation.mode === preferences.modeSouhaite) bonus += 5;
    if (
      preferences.modeSouhaite !== "indifferent" &&
      formation.mode !== preferences.modeSouhaite
    )
      malus += 3;

    const interets = preferences.tagsInterets ?? [];
    const tagsFormation = formation.tags ?? [];
    if (tagsFormation.some((tag) => interets.includes(tag))) bonus += 5;

    if (formation.distanceKm <= preferences.distanceMaxKm / 2) bonus += 2;
    else malus += 2;

    // 4) Score final borné
    const scoreFinal = clamp(scoreCompetences + bonus - malus - prereqPenalty, 0, 100);

    recommandations.push({
      formation: formation.nom,
      score: scoreFinal,
      niveau:
        scoreFinal >= 75
          ? "Fortement recommandé"
          : scoreFinal >= 50
          ? "Adapté"
          : "À renforcer",
      pointsForts: topMatieres(scoresEtudiant, formation.poids, 2),
      gaps: matieresSousSeuil(scoresEtudiant, formation.prerequis),
      mode: formation.mode,
      cout: formation.cout,
      distanceKm: formation.distanceKm,
    });
  }

  // 5) Tri décroissant
  recommandations.sort((a, b) => b.score - a.score);
  return recommandations;
};

// Exemple minimal d'utilisation (à retirer ou adapter selon besoin) :
// const scores = { maths: 17, physique: 14, anglais: 12 }; // notes sur 20
// const preferences = {
//   budgetMax: 8000,
//   distanceMaxKm: 30,
//   modeSouhaite: "presentiel",
//   tagsInterets: ["data", "ingénierie"],
// };
// const formations: Formation[] = [
//   {
//     nom: "Licence Data",
//     prerequis: { maths: 12 },
//     poids: { maths: 0.6, anglais: 0.2, physique: 0.2 },
//     cout: 7000,
//     distanceKm: 10,
//     mode: "presentiel",
//     tags: ["data"],
//     capaciteDisponible: 25,
//   },
// ];
// console.log(recommanderFormations(scores, preferences, formations));

