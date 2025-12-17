
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const faqs = [
    {
        question: "What is Single Ank?",
        answer:
        "In this type, you bet on a single number from 0 to 9 for either the 'Open' or 'Close' result. For example, you can bet on the number 5 for the Open result.",
    },
    {
        question: "What is Jodi?",
        answer:
        "Jodi is a two-digit number from 00 to 99. It is formed by combining the Open single digit and the Close single digit. For example, if the Open result is 4 and the Close result is 8, the Jodi is 48.",
    },
    {
        question: "What is Panna?",
        answer: "A Panna is a three-digit number. The Open and Close results are both declared as Pannas. Pannas are of three types: Single Panna (SP), Double Panna (DP), and Triple Panna (TP)."
    },
    {
        question: "What is a Single Panna (SP)?",
        answer: "A Single Panna is a three-digit number where all three digits are unique. For example, 128, 357, 490."
    },
      {
      question: "What is a Double Panna (DP)?",
      answer: "A Double Panna is a three-digit number where two of the three digits are the same. For example, 112, 335, 880."
    },
      {
      question: "What is a Triple Panna (TP)?",
      answer: "A Triple Panna is a three-digit number where all three digits are the same. For example, 111, 555, 999."
    },
    {
      question: "What is Half Sangam?",
      answer: "In Half Sangam, you bet on a combination of one Panna and one single digit. There are two types: 1) Open Panna and the Close single digit, or 2) Close Panna and the Open single digit. For example, you can bet on Open Panna '123' and Close Digit '8'."
    },
    {
      question: "What is Full Sangam?",
      answer: "In Full Sangam, you bet on the complete result, which includes both the Open Panna and the Close Panna. For example, you can bet on Open Panna '123' and Close Panna '456'."
    },
    {
      question: "How are the results declared?",
      answer: "The result is declared in two parts: 'Open' and 'Close'. For each part, a three-digit number (Panna) is drawn. The sum of the three digits of the Panna gives a single digit (Ank). For example, if the Open Panna is 123, the Open Ank is 1+2+3 = 6. The final result is a combination of the Open Ank and Close Ank, which forms the Jodi."
    },
];

export default function FAQPage() {
  return (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardDescription className="text-white/80">
          Answers to common questions about the game.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="border-b-white/20">
              <AccordionTrigger className="text-white hover:no-underline">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-white/80">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
