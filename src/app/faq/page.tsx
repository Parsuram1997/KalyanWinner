
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
      "First, you need to have funds in your wallet. If not, go to the 'Wallet' page to add funds. Then, navigate to the 'Play' page, select a market (Kalyan Day or Kalyan Night), choose a game type (like Jodi, Panna, etc.), enter your number and amount, and place your bet.",
  },
  {
    question: "What are the different game types?",
    answer:
      "There are several game types available: Single Digit (0-9), Jodi (00-99), Single Panna (three unique digits), Double Panna (two digits are the same), Triple Panna (all three digits are the same), Half Sangam, and Full Sangam.",
  },
  {
    question: "How are the results declared?",
    answer:
      "Each result has two parts: an 'Open' result and a 'Close' result. Each part consists of a three-digit Panna. The sum of the digits of the Panna gives a single digit. The Jodi is formed by combining the Open single digit and the Close single digit.",
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
       <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions (FAQ)</h1>
        <p className="text-muted-foreground">
          Find answers to common questions about playing Kalyan Matka.
        </p>
      </div>
      <Card>
         <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            <span>General Information</span>
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
