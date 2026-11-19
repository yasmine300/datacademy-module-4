"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const TYPES = ["congés", "RTT", "maladie", "télétravail"];

// Date du jour au format AAAA-MM-JJ (heure locale)
function versTexte(date) {
  const a = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const j = String(date.getDate()).padStart(2, "0");
  return `${a}-${m}-${j}`;
}

// Lundi et dimanche de la semaine en cours
function bornesSemaine() {
  const aujourdhui = new Date();
  const decalage = (aujourdhui.getDay() + 6) % 7; // 0 = lundi
  const lundi = new Date(aujourdhui);
  lundi.setDate(aujourdhui.getDate() - decalage);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  return { lundi: versTexte(lundi), dimanche: versTexte(dimanche) };
}

function formatFr(texte) {
  const [a, m, j] = texte.split("-");
  return `${j}/${m}/${a}`;
}

export default function Page() {
  const [absences, setAbsences] = useState([]);
  const [prenom, setPrenom] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [du, setDu] = useState("");
  const [au, setAu] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function charger() {
    const { data, error } = await supabase
      .from("absences")
      .select("*")
      .order("date_debut", { ascending: true });
    if (error) {
      setErreur("Impossible de lire les absences : " + error.message);
      return;
    }
    setAbsences(data);
  }

  useEffect(() => {
    charger();
  }, []);

  async function ajouter(e) {
    e.preventDefault();
    setErreur("");
    if (au < du) {
      setErreur("La date « Au » doit être après la date « Du ».");
      return;
    }
    setEnvoi(true);
    const { error } = await supabase
      .from("absences")
      .insert({ prenom: prenom.trim(), type, date_debut: du, date_fin: au });
    setEnvoi(false);
    if (error) {
      setErreur("Impossible d'enregistrer l'absence : " + error.message);
      return;
    }
    setPrenom("");
    setDu("");
    setAu("");
    charger();
  }

  // Synthèse : personnes différentes absentes au moins un jour cette semaine
  const { lundi, dimanche } = bornesSemaine();
  const absentsSemaine = new Set(
    absences
      .filter((a) => a.date_debut <= dimanche && a.date_fin >= lundi)
      .map((a) => a.prenom.toLowerCase())
  ).size;

  // Liste : absences en cours ou à venir d'abord (la plus proche en premier),
  // puis les absences passées (la plus récente en premier)
  const aujourdhui = versTexte(new Date());
  const aVenir = absences.filter((a) => a.date_fin >= aujourdhui);
  const passees = absences
    .filter((a) => a.date_fin < aujourdhui)
    .sort((x, y) => (x.date_debut < y.date_debut ? 1 : -1));
  const liste = [...aVenir, ...passees];

  return (
    <main>
      <h1>Absences de l'équipe</h1>
      <p className="synthese">
        {absentsSemaine === 0
          ? "Personne n'est absent cette semaine."
          : `${absentsSemaine} personne${absentsSemaine > 1 ? "s" : ""} absente${
              absentsSemaine > 1 ? "s" : ""
            } cette semaine.`}
      </p>

      <form onSubmit={ajouter}>
        <label>
          Prénom
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Du
          <input type="date" value={du} onChange={(e) => setDu(e.target.value)} required />
        </label>
        <label>
          Au
          <input type="date" value={au} onChange={(e) => setAu(e.target.value)} required />
        </label>
        <button type="submit" disabled={envoi}>
          {envoi ? "Ajout…" : "Ajouter"}
        </button>
      </form>

      {erreur && <p className="erreur">{erreur}</p>}

      {liste.length === 0 ? (
        <p>Aucune absence enregistrée pour le moment.</p>
      ) : (
        <ul>
          {liste.map((a) => (
            <li key={a.id}>
              <strong>{a.prenom}</strong>
              <span className="type">{a.type}</span>
              <span>
                du {formatFr(a.date_debut)} au {formatFr(a.date_fin)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
