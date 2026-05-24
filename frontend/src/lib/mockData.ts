import type { Assignment, QuestionPaper } from "@/store/assignmentStore";

export const mockAssignments: Assignment[] = [
  { id: "1", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "2", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "3", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "4", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "5", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "6", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "7", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "8", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "9", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
  { id: "10", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025", status: "done" },
];

export const mockPaper: QuestionPaper = {
  id: "paper-1",
  assignmentId: "1",
  schoolName: "Delhi Public School, Sector-4, Bokaro",
  subject: "English",
  className: "5th",
  timeAllowed: "45 minutes",
  maxMarks: 20,
  sections: [
    {
      label: "Section A",
      instruction: "Short Answer Questions\nAttempt all questions. Each question carries 2 marks",
      questions: [
        { number: 1, text: "Define electroplating. Explain its purpose.", difficulty: "Easy", marks: 2, type: "short" },
        { number: 2, text: "What is the role of a conductor in the process of electrolysis?", difficulty: "Moderate", marks: 2, type: "short" },
        { number: 3, text: "Why does a solution of copper sulfate conduct electricity?", difficulty: "Easy", marks: 2, type: "short" },
        { number: 4, text: "Describe one example of the chemical effect of electric current in daily life.", difficulty: "Moderate", marks: 2, type: "short" },
        { number: 5, text: "Explain why electric current is said to have chemical effects.", difficulty: "Moderate", marks: 2, type: "short" },
        { number: 6, text: "How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.", difficulty: "Challenging", marks: 2, type: "short" },
        { number: 7, text: "What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.", difficulty: "Challenging", marks: 2, type: "short" },
        { number: 8, text: "Mention the type of current used in electroplating and justify why it is used.", difficulty: "Easy", marks: 2, type: "short" },
        { number: 9, text: "What is the importance of electric current in the field of metallurgy?", difficulty: "Moderate", marks: 2, type: "short" },
        { number: 10, text: "Explain with a chemical equation how copper is deposited during the electroplating of an object.", difficulty: "Challenging", marks: 2, type: "short" },
      ],
    },
  ],
  answerKey: [
    "Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness.",
    "A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes.",
    "Copper sulfate contains free copper and sulfate ions which carry electric charge, thus conducting electricity.",
    "An example is the electroplating of silver on jewelry to prevent tarnishing.",
    "Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects.",
    "Sodium hydroxide is formed at the cathode during brine electrolysis as water gains electrons: 2H₂O + 2e⁻ → H₂ + 2OH⁻ / Na⁺ + OH⁻ → NaOH (in solution)",
    "At the cathode: water is reduced to hydrogen gas and hydroxide ions. At the anode: water is oxidized to oxygen gas and hydrogen ions.",
    "Direct current (DC) is used in electroplating because it flows in one direction, ensuring consistent deposition of metal at the cathode.",
    "Electric current is used in the extraction and purification of metals like aluminium and copper through electrolytic refining.",
    "CuSO₄ → Cu²⁺ + SO₄²⁻ / At cathode: Cu²⁺ + 2e⁻ → Cu (deposited on object)",
  ],
};
