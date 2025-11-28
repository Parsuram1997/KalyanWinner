
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is Kalyan Matka?",
    answer:
      "Kalyan Matka is a popular form of lottery or betting that originated in Mumbai, India. It involves betting on numbers and their combinations. The game is based on guessing the correct numbers to win.",
  },
  {
    question: "How do I play the game on this app?",
    answer:
      "First, you need to have funds in your wallet. If not, go to the 'Wallet' page to add funds. Then, navigate to the 'Play' page, select a market (Kalyan Day or Kalyan Night), choose a game type, enter your number and amount, and place your bet.",
  },
   {
    question: "What are the different game types?",
    answer:
      "There are several game types: Single Digit (Ank), Jodi, Single Panna (SP), Double Panna (DP), Triple Panna (TP), Half Sangam, and Full Sangam. Each has a different betting method and payout rate.",
  },
  {
    question: "What is Single Digit (Ank)?",
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
  {
    question: "How can I check the results?",
    answer:
      "You can view the latest and historical results on the 'Results' page. The Dashboard also shows the most recent result.",
  },
  {
    question: "What are the payout rates?",
    answer:
      "The payout rates for different game types are listed on the 'Rates' page. The rate indicates how much you win for a certain bet amount.",
  },
  {
    question: "How do I add funds to my wallet?",
    answer:
      "Go to the 'Wallet' page and click on 'Add Funds'. You can transfer money via UPI or Bank Transfer. After the transfer, you must submit the transaction's UTR/Reference number to get the funds credited to your wallet after verification.",
  },
  {
    question: "How can I withdraw my winnings?",
    answer:
      "You can request a withdrawal from the 'Wallet' page. Please note that withdrawals are processed only on specific days and there might be a minimum withdrawal amount. Check the wallet page for more details.",
  },
];


export default function FaqPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
         <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            <span>Frequently Asked Questions (FAQ)</span>
          </CardTitle>
          <CardDescription>
            Click on a question to see the answer.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent>
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
