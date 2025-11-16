
"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Eye, Trash, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { createUser, deleteUser, updateUser } from "@/app/actions/user-actions";


const USERS_PER_PAGE = 10;

const states = [
  { "value": "AN", "label": "Andaman and Nicobar Islands" },
  { "value": "AP", "label": "Andhra Pradesh" },
  { "value": "AR", "label": "Arunachal Pradesh" },
  { "value": "AS", "label": "Assam" },
  { "value": "BR", "label": "Bihar" },
  { "value": "CG", "label": "Chandigarh" },
  { "value": "CH", "label": "Chhattisgarh" },
  { "value": "DH", "label": "Dadra and Nagar Haveli" },
  { "value": "DD", "label": "Daman and Diu" },
  { "value": "DL", "label": "Delhi" },
  { "value": "GA", "label": "Goa" },
  { "value": "GJ", "label": "Gujarat" },
  { "value": "HR", "label": "Haryana" },
  { "value": "HP", "label": "Himachal Pradesh" },
  { "value": "JK", "label": "Jammu and Kashmir" },
  { "value": "JH", "label": "Jharkhand" },
  { "value": "KA", "label": "Karnataka" },
  { "value": "KL", "label": "Kerala" },
  { "value": "LD", "label": "Lakshadweep" },
  { "value": "MP", "label": "Madhya Pradesh" },
  { "value": "MH", "label": "Maharashtra" },
  { "value": "MN", "label": "Manipur" },
  { "value": "ML", "label": "Meghalaya" },
  { "value": "MZ", "label": "Mizoram" },
  { "value": "NL", "label": "Nagaland" },
  { "value": "OR", "label": "Odisha" },
  { "value": "PY", "label": "Puducherry" },
  { "value": "PB", "label": "Punjab" },
  { "value": "RJ", "label": "Rajasthan" },
  { "value": "SK", "label": "Sikkim" },
  { "value": "TN", "label": "Tamil Nadu" },
  { "value": "TS", "label": "Telangana" },
  { "value": "TR", "label": "Tripura" },
  { "value": "UK", "label": "Uttarakhand" },
  { "value": "UP", "label": "Uttar Pradesh" },
  { "value": "WB", "label": "West Bengal" }
]

const districts: { [key: string]: { value: string, label: string }[] } = {
    AN: [
        {"value": "nicobars", "label": "Nicobars"},
        {"value": "north and middle andaman", "label": "North and Middle Andaman"},
        {"value": "south andaman", "label": "South Andaman"}
    ],
    AP: [
        {"value": "srikakulam", "label": "Srikakulam"},
        {"value": "vizianagaram", "label": "Vizianagaram"},
        {"value": "visakhapatnam", "label": "Visakhapatnam"},
        {"value": "east godavari", "label": "East Godavari"},
        {"value": "west godavari", "label": "West Godavari"},
        {"value": "krishna", "label": "Krishna"},
        {"value": "guntur", "label": "Guntur"},
        {"value": "prakasam", "label": "Prakasam"},
        {"value": "sri potti sriramulu nellore", "label": "Sri Potti Sriramulu Nellore"},
        {"value": "ysr", "label": "YSR"},
        {"value": "kurnool", "label": "Kurnool"},
        {"value": "anantapur", "label": "Anantapur"},
        {"value": "chittoor", "label": "Chittoor"}
    ],
    AR: [
        {"value": "tawang", "label": "Tawang"},
        {"value": "west kameng", "label": "West Kameng"},
        {"value": "east kameng", "label": "East Kameng"},
        {"value": "papum pare", "label": "Papum Pare"},
        {"value": "kurung kumey", "label": "Kurung Kumey"},
        {"value": "kra daadi", "label": "Kra Daadi"},
        {"value": "lower subansiri", "label": "Lower Subansiri"},
        {"value": "upper subansiri", "label": "Upper Subansiri"},
        {"value": "west siang", "label": "West Siang"},
        {"value": "east siang", "label": "East Siang"},
        {"value": "siang", "label": "Siang"},
        {"value": "upper siang", "label": "Upper Siang"},
        {"value": "lower siang", "label": "Lower Siang"},
        {"value": "lower dibang valley", "label": "Lower Dibang Valley"},
        {"value": "dibang valley", "label": "Dibang Valley"},
        {"value": "anjaw", "label": "Anjaw"},
        {"value": "lohit", "label": "Lohit"},
        {"value": "namsai", "label": "Namsai"},
        {"value": "changlang", "label": "Changlang"},
        {"value": "tirap", "label": "Tirap"},
        {"value": "longding", "label": "Longding"}
    ],
    AS: [
        {"value": "baksa", "label": "Baksa"},
        {"value": "barpeta", "label": "Barpeta"},
        {"value": "biswanath", "label": "Biswanath"},
        {"value": "bongaigaon", "label": "Bongaigaon"},
        {"value": "cachar", "label": "Cachar"},
        {"value": "charaideo", "label": "Charaideo"},
        {"value": "chirang", "label": "Chirang"},
        {"value": "darrang", "label": "Darrang"},
        {"value": "dhemaji", "label": "Dhemaji"},
        {"value": "dhubri", "label": "Dhubri"},
        {"value": "dibrugarh", "label": "Dibrugarh"},
        {"value": "dima hasao", "label": "Dima Hasao"},
        {"value": "goalpara", "label": "Goalpara"},
        {"value": "golaghat", "label": "Golaghat"},
        {"value": "hailakandi", "label": "Hailakandi"},
        {"value": "hojai", "label": "Hojai"},
        {"value": "jorhat", "label": "Jorhat"},
        {"value": "kamrup metropolitan", "label": "Kamrup Metropolitan"},
        {"value": "kamrup", "label": "Kamrup"},
        {"value": "karbi anglong", "label": "Karbi Anglong"},
        {"value": "karimganj", "label": "Karimganj"},
        {"value": "kokrajhar", "label": "Kokrajhar"},
        {"value": "lakhimpur", "label": "Lakhimpur"},
        {"value": "majuli", "label": "Majuli"},
        {"value": "morigaon", "label": "Morigaon"},
        {"value": "nagaon", "label": "Nagaon"},
        {"value": "nalbari", "label": "Nalbari"},
        {"value": "sivasagar", "label": "Sivasagar"},
        {"value": "sonitpur", "label": "Sonitpur"},
        {"value": "south salmara-mankachar", "label": "South Salmara-Mankachar"},
        {"value": "tinsukia", "label": "Tinsukia"},
        {"value": "udalguri", "label": "Udalguri"},
        {"value": "west karbi anglong", "label": "West Karbi Anglong"}
    ],
    BR: [
        {"value": "araria", "label": "Araria"},
        {"value": "arwal", "label": "Arwal"},
        {"value": "aurangabad", "label": "Aurangabad"},
        {"value": "banka", "label": "Banka"},
        {"value": "begusarai", "label": "Begusarai"},
        {"value": "bhagalpur", "label": "Bhagalpur"},
        {"value": "bhojpur", "label": "Bhojpur"},
        {"value": "buxar", "label": "Buxar"},
        {"value": "darbhanga", "label": "Darbhanga"},
        {"value": "east champaran", "label": "East Champaran"},
        {"value": "gaya", "label": "Gaya"},
        {"value": "gopalganj", "label": "Gopalganj"},
        {"value": "jamui", "label": "Jamui"},
        {"value": "jehanabad", "label": "Jehanabad"},
        {"value": "khagaria", "label": "Khagaria"},
        {"value": "kishanganj", "label": "Kishanganj"},
        {"value": "kaimur", "label": "Kaimur"},
        {"value": "katihar", "label": "Katihar"},
        {"value": "lakhisarai", "label": "Lakhisarai"},
        {"value": "madhubani", "label": "Madhubani"},
        {"value": "munger", "label": "Munger"},
        {"value": "madhepura", "label": "Madhepura"},
        {"value": "muzaffarpur", "label": "Muzaffarpur"},
        {"value": "nalanda", "label": "Nalanda"},
        {"value": "nawada", "label": "Nawada"},
        {"value": "patna", "label": "Patna"},
        {"value": "purnia", "label": "Purnia"},
        {"value": "rohtas", "label": "Rohtas"},
        {"value": "saharsa", "label": "Saharsa"},
        {"value": "samastipur", "label": "Samastipur"},
        {"value": "sheikhpura", "label": "Sheikhpura"},
        {"value": "sheohar", "label": "Sheohar"},
        {"value": "saran", "label": "Saran"},
        {"value": "sitamarhi", "label": "Sitamarhi"},
        {"value": "supaul", "label": "Supaul"},
        {"value": "siwan", "label": "Siwan"},
        {"value": "vaishali", "label": "Vaishali"},
        {"value": "west champaran", "label": "West Champaran"}
    ],
    CG: [{"value": "chandigarh", "label": "Chandigarh"}],
    CH: [
        {"value": "balod", "label": "Balod"},
        {"value": "baloda bazar", "label": "Baloda Bazar"},
        {"value": "balrampur", "label": "Balrampur"},
        {"value": "bastar", "label": "Bastar"},
        {"value": "bemetara", "label": "Bemetara"},
        {"value": "bijapur", "label": "Bijapur"},
        {"value": "bilaspur", "label": "Bilaspur"},
        {"value": "dantewada", "label": "Dantewada"},
        {"value": "dhamtari", "label": "Dhamtari"},
        {"value": "durg", "label": "Durg"},
        {"value": "gariaband", "label": "Gariaband"},
        {"value": "janjgir-champa", "label": "Janjgir-Champa"},
        {"value": "jashpur", "label": "Jashpur"},
        {"value": "kabirdham", "label": "Kabirdham"},
        {"value": "kanker", "label": "Kanker"},
        {"value": "kondagaon", "label": "Kondagaon"},
        {"value": "korba", "label": "Korba"},
        {"value": "korea", "label": "Korea"},
        {"value": "mahasamund", "label": "Mahasamund"},
        {"value": "mungeli", "label": "Mungeli"},
        {"value": "narayanpur", "label": "Narayanpur"},
        {"value": "raigarh", "label": "Raigarh"},
        {"value": "raipur", "label": "Raipur"},
        {"value": "rajnandgaon", "label": "Rajnandgaon"},
        {"value": "sukma", "label": "Sukma"},
        {"value": "surajpur", "label": "Surajpur"},
        {"value": "surguja", "label": "Surguja"}
    ],
    DH: [{"value": "dadra and nagar haveli", "label": "Dadra and Nagar Haveli"}],
    DD: [
        {"value": "daman", "label": "Daman"},
        {"value": "diu", "label": "Diu"}
    ],
    DL: [
        {"value": "central delhi", "label": "Central Delhi"},
        {"value": "east delhi", "label": "East Delhi"},
        {"value": "new delhi", "label": "New Delhi"},
        {"value": "north delhi", "label": "North Delhi"},
        {"value": "north east delhi", "label": "North East Delhi"},
        {"value": "north west delhi", "label": "North West Delhi"},
        {"value": "shahdara", "label": "Shahdara"},
        {"value": "south delhi", "label": "South Delhi"},
        {"value": "south east delhi", "label": "South East Delhi"},
        {"value": "south west delhi", "label": "South West Delhi"},
        {"value": "west delhi", "label": "West Delhi"}
    ],
    GA: [
        {"value": "north goa", "label": "North Goa"},
        {"value": "south goa", "label": "South Goa"}
    ],
    GJ: [
        {"value": "ahmedabad", "label": "Ahmedabad"},
        {"value": "amreli", "label": "Amreli"},
        {"value": "anand", "label": "Anand"},
        {"value": "aravalli", "label": "Aravalli"},
        {"value": "banaskantha", "label": "Banaskantha"},
        {"value": "bharuch", "label": "Bharuch"},
        {"value": "bhavnagar", "label": "Bhavnagar"},
        {"value": "botad", "label": "Botad"},
        {"value": "chhota udaipur", "label": "Chhota Udaipur"},
        {"value": "dahod", "label": "Dahod"},
        {"value": "dangs", "label": "Dangs"},
        {"value": "devbhoomi dwarka", "label": "Devbhoomi Dwarka"},
        {"value": "gandhinagar", "label": "Gandhinagar"},
        {"value": "gir somnath", "label": "Gir Somnath"},
        {"value": "jamnagar", "label": "Jamnagar"},
        {"value": "junagadh", "label": "Junagadh"},
        {"value": "kutch", "label": "Kutch"},
        {"value": "kheda", "label": "Kheda"},
        {"value": "mahisagar", "label": "Mahisagar"},
        {"value": "mehsana", "label": "Mehsana"},
        {"value": "morbi", "label": "Morbi"},
        {"value": "narmada", "label": "Narmada"},
        {"value": "navsari", "label": "Navsari"},
        {"value": "panchmahal", "label": "Panchmahal"},
        {"value": "patan", "label": "Patan"},
        {"value": "porbandar", "label": "Porbandar"},
        {"value": "rajkot", "label": "Rajkot"},
        {"value": "sabarkantha", "label": "Sabarkantha"},
        {"value": "surat", "label": "Surat"},
        {"value": "surendranagar", "label": "Surendranagar"},
        {"value": "tapi", "label": "Tapi"},
        {"value": "vadodara", "label": "Vadodara"},
        {"value": "valsad", "label": "Valsad"}
    ],
    HR: [
        {"value": "ambala", "label": "Ambala"},
        {"value": "bhiwani", "label": "Bhiwani"},
        {"value": "charkhi dadri", "label": "Charkhi Dadri"},
        {"value": "faridabad", "label": "Faridabad"},
        {"value": "fatehabad", "label": "Fatehabad"},
        {"value": "gurugram", "label": "Gurugram"},
        {"value": "hisar", "label": "Hisar"},
        {"value": "jhajjar", "label": "Jhajjar"},
        {"value": "jind", "label": "Jind"},
        {"value": "kaithal", "label": "Kaithal"},
        {"value": "karnal", "label": "Karnal"},
        {"value": "kurukshetra", "label": "Kurukshetra"},
        {"value": "mahendragarh", "label": "Mahendragarh"},
        {"value": "nuh", "label": "Nuh"},
        {"value": "palwal", "label": "Palwal"},
        {"value": "panchkula", "label": "Panchkula"},
        {"value": "panipat", "label": "Panipat"},
        {"value": "rewari", "label": "Rewari"},
        {"value": "rohtak", "label": "Rohtak"},
        {"value": "sirsa", "label": "Sirsa"},
        {"value": "sonipat", "label": "Sonipat"},
        {"value": "yamunanagar", "label": "Yamunanagar"}
    ],
    HP: [
        {"value": "bilaspur", "label": "Bilaspur"},
        {"value": "chamba", "label": "Chamba"},
        {"value": "hamirpur", "label": "Hamirpur"},
        {"value": "kangra", "label": "Kangra"},
        {"value": "kinnaur", "label": "Kinnaur"},
        {"value": "kullu", "label": "Kullu"},
        {"value": "lahaul and spiti", "label": "Lahaul and Spiti"},
        {"value": "mandi", "label": "Mandi"},
        {"value": "shimla", "label": "Shimla"},
        {"value": "sirmaur", "label": "Sirmaur"},
        {"value": "solan", "label": "Solan"},
        {"value": "una", "label": "Una"}
    ],
    JK: [
        {"value": "anantnag", "label": "Anantnag"},
        {"value": "bandipora", "label": "Bandipora"},
        {"value": "baramulla", "label": "Baramulla"},
        {"value": "budgam", "label": "Budgam"},
        {"value": "doda", "label": "Doda"},
        {"value": "ganderbal", "label": "Ganderbal"},
        {"value": "jammu", "label": "Jammu"},
        {"value": "kargil", "label": "Kargil"},
        {"value": "kathua", "label": "Kathua"},
        {"value": "kishtwar", "label": "Kishtwar"},
        {"value": "kulgam", "label": "Kulgam"},
        {"value": "kupwara", "label": "Kupwara"},
        {"value": "leh", "label": "Leh"},
        {"value": "poonch", "label": "Poonch"},
        {"value": "pulwama", "label": "Pulwama"},
        {"value": "rajouri", "label": "Rajouri"},
        {"value": "ramban", "label": "Ramban"},
        {"value": "reasi", "label": "Reasi"},
        {"value": "samba", "label": "Samba"},
        {"value": "shopian", "label": "Shopian"},
        {"value": "srinagar", "label": "Srinagar"},
        {"value": "udhampur", "label": "Udhampur"}
    ],
    JH: [
        {"value": "bokaro", "label": "Bokaro"},
        {"value": "chatra", "label": "Chatra"},
        {"value": "deoghar", "label": "Deoghar"},
        {"value": "dhanbad", "label": "Dhanbad"},
        {"value": "dumka", "label": "Dumka"},
        {"value": "east singhbhum", "label": "East Singhbhum"},
        {"value": "garhwa", "label": "Garhwa"},
        {"value": "giridih", "label": "Giridih"},
        {"value": "godda", "label": "Godda"},
        {"value": "gumla", "label": "Gumla"},
        {"value": "hazaribagh", "label": "Hazaribagh"},
        {"value": "jamtara", "label": "Jamtara"},
        {"value": "khunti", "label": "Khunti"},
        {"value": "koderma", "label": "Koderma"},
        {"value": "latehar", "label": "Latehar"},
        {"value": "lohardaga", "label": "Lohardaga"},
        {"value": "pakur", "label": "Pakur"},
        {"value": "palamu", "label": "Palamu"},
        {"value": "ramgarh", "label": "Ramgarh"},
        {"value": "ranchi", "label": "Ranchi"},
        {"value": "sahibganj", "label": "Sahibganj"},
        {"value": "seraikela kharsawan", "label": "Seraikela Kharsawan"},
        {"value": "simdega", "label": "Simdega"},
        {"value": "west singhbhum", "label": "West Singhbhum"}
    ],
    KA: [
        {"value": "bagalkot", "label": "Bagalkot"},
        {"value": "ballari", "label": "Ballari"},
        {"value": "belagavi", "label": "Belagavi"},
        {"value": "bengaluru rural", "label": "Bengaluru Rural"},
        {"value": "bengaluru urban", "label": "Bengaluru Urban"},
        {"value": "bidar", "label": "Bidar"},
        {"value": "chamarajanagar", "label": "Chamarajanagar"},
        {"value": "chikballapur", "label": "Chikballapur"},
        {"value": "chikkamagaluru", "label": "Chikkamagaluru"},
        {"value": "chitradurga", "label": "Chitradurga"},
        {"value": "dakshina kannada", "label": "Dakshina Kannada"},
        {"value": "davangere", "label": "Davangere"},
        {"value": "dharwad", "label": "Dharwad"},
        {"value": "gadag", "label": "Gadag"},
        {"value": "hassan", "label": "Hassan"},
        {"value": "haveri", "label": "Haveri"},
        {"value": "kalaburagi", "label": "Kalaburagi"},
        {"value": "kodagu", "label": "Kodagu"},
        {"value": "kolar", "label": "Kolar"},
        {"value": "koppal", "label": "Koppal"},
        {"value": "mandya", "label": "Mandya"},
        {"value": "mysuru", "label": "Mysuru"},
        {"value": "raichur", "label": "Raichur"},
        {"value": "ramanagara", "label": "Ramanagara"},
        {"value": "shivamogga", "label": "Shivamogga"},
        {"value": "tumakuru", "label": "Tumakuru"},
        {"value": "udupi", "label": "Udupi"},
        {"value": "uttara kannada", "label": "Uttara Kannada"},
        {"value": "vijayapura", "label": "Vijayapura"},
        {"value": "yadgir", "label": "Yadgir"}
    ],
    KL: [
        {"value": "alappuzha", "label": "Alappuzha"},
        {"value": "ernakulam", "label": "Ernakulam"},
        {"value": "idukki", "label": "Idukki"},
        {"value": "kannur", "label": "Kannur"},
        {"value": "kasaragod", "label": "Kasaragod"},
        {"value": "kollam", "label": "Kollam"},
        {"value": "kottayam", "label": "Kottayam"},
        {"value": "kozhikode", "label": "Kozhikode"},
        {"value": "malappuram", "label": "Malappuram"},
        {"value": "palakkad", "label": "Palakkad"},
        {"value": "pathanamthitta", "label": "Pathanamthitta"},
        {"value": "thiruvananthapuram", "label": "Thiruvananthapuram"},
        {"value": "thrissur", "label": "Thrissur"},
        {"value": "wayanad", "label": "Wayanad"}
    ],
    LD: [{"value": "lakshadweep", "label": "Lakshadweep"}],
    MP: [
        {"value": "agar malwa", "label": "Agar Malwa"},
        {"value": "alirajpur", "label": "Alirajpur"},
        {"value": "anuppur", "label": "Anuppur"},
        {"value": "ashoknagar", "label": "Ashoknagar"},
        {"value": "balaghat", "label": "Balaghat"},
        {"value": "barwani", "label": "Barwani"},
        {"value": "betul", "label": "Betul"},
        {"value": "bhind", "label": "Bhind"},
        {"value": "bhopal", "label": "Bhopal"},
        {"value": "burhanpur", "label": "Burhanpur"},
        {"value": "chhatarpur", "label": "Chhatarpur"},
        {"value": "chhindwara", "label": "Chhindwara"},
        {"value": "damoh", "label": "Damoh"},
        {"value": "datia", "label": "Datia"},
        {"value": "dewas", "label": "Dewas"},
        {"value": "dhar", "label": "Dhar"},
        {"value": "dindori", "label": "Dindori"},
        {"value": "guna", "label": "Guna"},
        {"value": "gwalior", "label": "Gwalior"},
        {"value": "harda", "label": "Harda"},
        {"value": "hoshangabad", "label": "Hoshangabad"},
        {"value": "indore", "label": "Indore"},
        {"value": "jabalpur", "label": "Jabalpur"},
        {"value": "jhabua", "label": "Jhabua"},
        {"value": "katni", "label": "Katni"},
        {"value": "khandwa", "label": "Khandwa"},
        {"value": "khargone", "label": "Khargone"},
        {"value": "mandla", "label": "Mandla"},
        {"value": "mandsaur", "label": "Mandsaur"},
        {"value": "morena", "label": "Morena"},
        {"value": "narsinghpur", "label": "Narsinghpur"},
        {"value": "neemuch", "label": "Neemuch"},
        {"value": "panna", "label": "Panna"},
        {"value": "raisen", "label": "Raisen"},
        {"value": "rajgarh", "label": "Rajgarh"},
        {"value": "ratlam", "label": "Ratlam"},
        {"value": "rewa", "label": "Rewa"},
        {"value": "sagar", "label": "Sagar"},
        {"value": "satna", "label": "Satna"},
        {"value": "sehore", "label": "Sehore"},
        {"value": "seoni", "label": "Seoni"},
        {"value": "shahdol", "label": "Shahdol"},
        {"value": "shajapur", "label": "Shajapur"},
        {"value": "sheopur", "label": "Sheopur"},
        {"value": "shivpuri", "label": "Shivpuri"},
        {"value": "sidhi", "label": "Sidhi"},
        {"value": "singrauli", "label": "Singrauli"},
        {"value": "tikamgarh", "label": "Tikamgarh"},
        {"value": "ujjain", "label": "Ujjain"},
        {"value": "umaria", "label": "Umaria"},
        {"value": "vidisha", "label": "Vidisha"}
    ],
    MH: [
        {"value": "ahmednagar", "label": "Ahmednagar"},
        {"value": "akola", "label": "Akola"},
        {"value": "amravati", "label": "Amravati"},
        {"value": "aurangabad", "label": "Aurangabad"},
        {"value": "beed", "label": "Beed"},
        {"value": "bhandara", "label": "Bhandara"},
        {"value": "buldhana", "label": "Buldhana"},
        {"value": "chandrapur", "label": "Chandrapur"},
        {"value": "dhule", "label": "Dhule"},
        {"value": "gadchiroli", "label": "Gadchiroli"},
        {"value": "gondia", "label": "Gondia"},
        {"value": "hingoli", "label": "Hingoli"},
        {"value": "jalgaon", "label": "Jalgaon"},
        {"value": "jalna", "label": "Jalna"},
        {"value": "kolhapur", "label": "Kolhapur"},
        {"value": "latur", "label": "Latur"},
        {"value": "mumbai city", "label": "Mumbai City"},
        {"value": "mumbai suburban", "label": "Mumbai Suburban"},
        {"value": "nagpur", "label": "Nagpur"},
        {"value": "nanded", "label": "Nanded"},
        {"value": "nandurbar", "label": "Nandurbar"},
        {"value": "nashik", "label": "Nashik"},
        {"value": "osmanabad", "label": "Osmanabad"},
        {"value": "palghar", "label": "Palghar"},
        {"value": "parbhani", "label": "Parbhani"},
        {"value": "pune", "label": "Pune"},
        {"value": "raigad", "label": "Raigad"},
        {"value": "ratnagiri", "label": "Ratnagiri"},
        {"value": "sangli", "label": "Sangli"},
        {"value": "satara", "label": "Satara"},
        {"value": "sindhudurg", "label": "Sindhudurg"},
        {"value": "solapur", "label": "Solapur"},
        {"value": "thane", "label": "Thane"},
        {"value": "wardha", "label": "Wardha"},
        {"value": "washim", "label": "Washim"},
        {"value": "yavatmal", "label": "Yavatmal"}
    ],
    MN: [
        {"value": "bishnupur", "label": "Bishnupur"},
        {"value": "chandel", "label": "Chandel"},
        {"value": "churachandpur", "label": "Churachandpur"},
        {"value": "imphal east", "label": "Imphal East"},
        {"value": "imphal west", "label": "Imphal West"},
        {"value": "jiribam", "label": "Jiribam"},
        {"value": "kakching", "label": "Kakching"},
        {"value": "kamjong", "label": "Kamjong"},
        {"value": "kangpokpi", "label": "Kangpokpi"},
        {"value": "noney", "label": "Noney"},
        {"value": "pherzawl", "label": "Pherzawl"},
        {"value": "senapati", "label": "Senapati"},
        {"value": "tamenglong", "label": "Tamenglong"},
        {"value": "tengnoupal", "label": "Tengnoupal"},
        {"value": "thoubal", "label": "Thoubal"},
        {"value": "ukhrul", "label": "Ukhrul"}
    ],
    ML: [
        {"value": "east garo hills", "label": "East Garo Hills"},
        {"value": "east jaintia hills", "label": "East Jaintia Hills"},
        {"value": "east khasi hills", "label": "East Khasi Hills"},
        {"value": "north garo hills", "label": "North Garo Hills"},
        {"value": "ribhoi", "label": "Ribhoi"},
        {"value": "south garo hills", "label": "South Garo Hills"},
        {"value": "south west garo hills", "label": "South West Garo Hills"},
        {"value": "south west khasi hills", "label": "South West Khasi Hills"},
        {"value": "west jaintia hills", "label": "West Jaintia Hills"},
        {"value": "west khasi hills", "label": "West Khasi Hills"}
    ],
    MZ: [
        {"value": "aizawl", "label": "Aizawl"},
        {"value": "champhai", "label": "Champhai"},
        {"value": "lawngtlai", "label": "Lawngtlai"},
        {"value": "lunglei", "label": "Lunglei"},
        {"value": "mamit", "label": "Mamit"},
        {"value": "saiha", "label": "Saiha"},
        {"value": "serchhip", "label": "Serchhip"}
    ],
    NL: [
        {"value": "dimapur", "label": "Dimapur"},
        {"value": "kiphire", "label": "Kiphire"},
        {"value": "kohima", "label": "Kohima"},
        {"value": "longleng", "label": "Longleng"},
        {"value": "mokokchung", "label": "Mokokchung"},
        {"value": "mon", "label": "Mon"},
        {"value": "peren", "label": "Peren"},
        {"value": "phek", "label": "Phek"},
        {"value": "tuensang", "label": "Tuensang"},
        {"value": "wokha", "label": "Wokha"},
        {"value": "zunheboto", "label": "Zunheboto"}
    ],
    OR: [
        {"value": "angul", "label": "Angul"},
        {"value": "balangir", "label": "Balangir"},
        {"value": "baleswar", "label": "Baleswar"},
        {"value": "bargarh", "label": "Bargarh"},
        {"value": "bhadrak", "label": "Bhadrak"},
        {"value": "boudh", "label": "Boudh"},
        {"value": "cuttack", "label": "Cuttack"},
        {"value": "debagarh", "label": "Debagarh"},
        {"value": "dhenkanal", "label": "Dhenkanal"},
        {"value": "gajapati", "label": "Gajapati"},
        {"value": "ganjam", "label": "Ganjam"},
        {"value": "jagatsinghpur", "label": "Jagatsinghpur"},
        {"value": "jajpur", "label": "Jajpur"},
        {"value": "jharsuguda", "label": "Jharsuguda"},
        {"value": "kalahandi", "label": "Kalahandi"},
        {"value": "kandhamal", "label": "Kandhamal"},
        {"value": "kendrapara", "label": "Kendrapara"},
        {"value": "kendujhar", "label": "Kendujhar"},
        {"value": "khordha", "label": "Khordha"},
        {"value": "koraput", "label": "Koraput"},
        {"value": "malkangiri", "label": "Malkangiri"},
        {"value": "mayurbhanj", "label": "Mayurbhanj"},
        {"value": "nabarangpur", "label": "Nabarangpur"},
        {"value": "nayagarh", "label": "Nayagarh"},
        {"value": "nuapada", "label": "Nuapada"},
        {"value": "puri", "label": "Puri"},
        {"value": "rayagada", "label": "Rayagada"},
        {"value": "sambalpur", "label": "Sambalpur"},
        {"value": "subarnapur", "label": "Subarnapur"},
        {"value": "sundargarh", "label": "Sundargarh"}
    ],
    PY: [
        {"value": "karaikal", "label": "Karaikal"},
        {"value": "mahe", "label": "Mahe"},
        {"value": "puducherry", "label": "Puducherry"},
        {"value": "yanam", "label": "Yanam"}
    ],
    PB: [
        {"value": "amritsar", "label": "Amritsar"},
        {"value": "barnala", "label": "Barnala"},
        {"value": "bathinda", "label": "Bathinda"},
        {"value": "faridkot", "label": "Faridkot"},
        {"value": "fatehgarh sahib", "label": "Fatehgarh Sahib"},
        {"value": "fazilka", "label": "Fazilka"},
        {"value": "firozpur", "label": "Firozpur"},
        {"value": "gurdaspur", "label": "Gurdaspur"},
        {"value": "hoshiarpur", "label": "Hoshiarpur"},
        {"value": "jalandhar", "label": "Jalandhar"},
        {"value": "kapurthala", "label": "Kapurthala"},
        {"value": "ludhiana", "label": "Ludhiana"},
        {"value": "mansa", "label": "Mansa"},
        {"value": "moga", "label": "Moga"},
        {"value": "sri muktsar sahib", "label": "Sri Muktsar Sahib"},
        {"value": "pathankot", "label": "Pathankot"},
        {"value": "patiala", "label": "Patiala"},
        {"value": "rupnagar", "label": "Rupnagar"},
        {"value": "sahibzada ajit singh nagar", "label": "Sahibzada Ajit Singh Nagar"},
        {"value": "sangrur", "label": "Sangrur"},
        {"value": "shahid bhagat singh nagar", "label": "Shahid Bhagat Singh Nagar"},
        {"value": "tarn taran", "label": "Tarn Taran"}
    ],
    RJ: [
        {"value": "ajmer", "label": "Ajmer"},
        {"value": "alwar", "label": "Alwar"},
        {"value": "banswara", "label": "Banswara"},
        {"value": "baran", "label": "Baran"},
        {"value": "barmer", "label": "Barmer"},
        {"value": "bharatpur", "label": "Bharatpur"},
        {"value": "bhilwara", "label": "Bhilwara"},
        {"value": "bikaner", "label": "Bikaner"},
        {"value": "bundi", "label": "Bundi"},
        {"value": "chittorgarh", "label": "Chittorgarh"},
        {"value": "churu", "label": "Churu"},
        {"value": "dausa", "label": "Dausa"},
        {"value": "dholpur", "label": "Dholpur"},
        {"value": "dungarpur", "label": "Dungarpur"},
        {"value": "hanumangarh", "label": "Hanumangarh"},
        {"value": "jaipur", "label": "Jaipur"},
        {"value": "jaisalmer", "label": "Jaisalmer"},
        {"value": "jalore", "label": "Jalore"},
        {"value": "jhalawar", "label": "Jhalawar"},
        {"value": "jhunjhunu", "label": "Jhunjhunu"},
        {"value": "jodhpur", "label": "Jodhpur"},
        {"value": "karauli", "label": "Karauli"},
        {"value": "kota", "label": "Kota"},
        {"value": "nagaur", "label": "Nagaur"},
        {"value": "pali", "label": "Pali"},
        {"value": "pratapgarh", "label": "Pratapgarh"},
        {"value": "rajsamand", "label": "Rajsamand"},
        {"value": "sawai madhopur", "label": "Sawai Madhopur"},
        {"value": "sikar", "label": "Sikar"},
        {"value": "sirohi", "label": "Sirohi"},
        {"value": "sri ganganagar", "label": "Sri Ganganagar"},
        {"value": "tonk", "label": "Tonk"},
        {"value": "udaipur", "label": "Udaipur"}
    ],
    SK: [
        {"value": "east sikkim", "label": "East Sikkim"},
        {"value": "north sikkim", "label": "North Sikkim"},
        {"value": "south sikkim", "label": "South Sikkim"},
        {"value": "west sikkim", "label": "West Sikkim"}
    ],
    TN: [
        {"value": "ariyalur", "label": "Ariyalur"},
        {"value": "chennai", "label": "Chennai"},
        {"value": "coimbatore", "label": "Coimbatore"},
        {"value": "cuddalore", "label": "Cuddalore"},
        {"value": "dharmapuri", "label": "Dharmapuri"},
        {"value": "dindigul", "label": "Dindigul"},
        {"value": "erode", "label": "Erode"},
        {"value": "kanchipuram", "label": "Kanchipuram"},
        {"value": "kanyakumari", "label": "Kanyakumari"},
        {"value": "karur", "label": "Karur"},
        {"value": "krishnagiri", "label": "Krishnagiri"},
        {"value": "madurai", "label": "Madurai"},
        {"value": "nagapattinam", "label": "Nagapattinam"},
        {"value": "namakkal", "label": "Namakkal"},
        {"value": "nilgiris", "label": "Nilgiris"},
        {"value": "perambalur", "label": "Perambalur"},
        {"value": "pudukkottai", "label": "Pudukkottai"},
        {"value": "ramanathapuram", "label": "Ramanathapuram"},
        {"value": "salem", "label": "Salem"},
        {"value": "sivaganga", "label": "Sivaganga"},
        {"value": "thanjavur", "label": "Thanjavur"},
        {"value": "theni", "label": "Theni"},
        {"value": "thoothukudi", "label": "Thoothukudi"},
        {"value": "tiruchirappalli", "label": "Tiruchirappalli"},
        {"value": "tirunelveli", "label": "Tirunelveli"},
        {"value": "tiruppur", "label": "Tiruppur"},
        {"value": "tiruvallur", "label": "Tiruvallur"},
        {"value": "tiruvannamalai", "label": "Tiruvannamalai"},
        {"value": "tiruvarur", "label": "Tiruvarur"},
        {"value": "vellore", "label": "Vellore"},
        {"value": "viluppuram", "label": "Viluppuram"},
        {"value": "virudhunagar", "label": "Virudhunagar"}
    ],
    TS: [
        {"value": "adilabad", "label": "Adilabad"},
        {"value": "bhadradri kothagudem", "label": "Bhadradri Kothagudem"},
        {"value": "hyderabad", "label": "Hyderabad"},
        {"value": "jagitial", "label": "Jagitial"},
        {"value": "jangaon", "label": "Jangaon"},
        {"value": "jayashankar bhoopalpally", "label": "Jayashankar Bhoopalpally"},
        {"value": "jogulamba gadwal", "label": "Jogulamba Gadwal"},
        {"value": "kamareddy", "label": "Kamareddy"},
        {"value": "karimnagar", "label": "Karimnagar"},
        {"value": "khammam", "label": "Khammam"},
        {"value": "komaram bheem", "label": "Komaram Bheem"},
        {"value": "mahabubabad", "label": "Mahabubabad"},
        {"value": "mahabubnagar", "label": "Mahabubnagar"},
        {"value": "mancherial", "label": "Mancherial"},
        {"value": "medak", "label": "Medak"},
        {"value": "medchal", "label": "Medchal"},
        {"value": "nagarkurnool", "label": "Nagarkurnool"},
        {"value": "nalgonda", "label": "Nalgonda"},
        {"value": "nirmal", "label": "Nirmal"},
        {"value": "nizamabad", "label": "Nizamabad"},
        {"value": "peddapalli", "label": "Peddapalli"},
        {"value": "rajanna sircilla", "label": "Rajanna Sircilla"},
        {"value": "ranga reddy", "label": "Ranga Reddy"},
        {"value": "sangareddy", "label": "Sangareddy"},
        {"value": "siddipet", "label": "Siddipet"},
        {"value": "suryapet", "label": "Suryapet"},
        {"value": "vikarabad", "label": "Vikarabad"},
        {"value": "wanaparthy", "label": "Wanaparthy"},
        {"value": "warangal rural", "label": "Warangal Rural"},
        {"value": "warangal urban", "label": "Warangal Urban"},
        {"value": "yadadri bhuvanagiri", "label": "Yadadri Bhuvanagiri"}
    ],
    TR: [
        {"value": "dhalai", "label": "Dhalai"},
        {"value": "gomati", "label": "Gomati"},
        {"value": "khowai", "label": "Khowai"},
        {"value": "north tripura", "label": "North Tripura"},
        {"value": "sepahijala", "label": "Sepahijala"},
        {"value": "south tripura", "label": "South Tripura"},
        {"value": "unakoti", "label": "Unakoti"},
        {"value": "west tripura", "label": "West Tripura"}
    ],
    UK: [
        {"value": "almora", "label": "Almora"},
        {"value": "bageshwar", "label": "Bageshwar"},
        {"value": "chamoli", "label": "Chamoli"},
        {"value": "champawat", "label": "Champawat"},
        {"value": "dehradun", "label": "Dehradun"},
        {"value": "haridwar", "label": "Haridwar"},
        {"value": "nainital", "label": "Nainital"},
        {"value": "pauri garhwal", "label": "Pauri Garhwal"},
        {"value": "pithoragarh", "label": "Pithoragarh"},
        {"value": "rudraprayag", "label": "Rudraprayag"},
        {"value": "tehri garhwal", "label": "Tehri Garhwal"},
        {"value": "udham singh nagar", "label": "Udham Singh Nagar"},
        {"value": "uttarkashi", "label": "Uttarkashi"}
    ],
    UP: [
        {"value": "agra", "label": "Agra"},
        {"value": "aligarh", "label": "Aligarh"},
        {"value": "allahabad", "label": "Allahabad"},
        {"value": "ambedkar nagar", "label": "Ambedkar Nagar"},
        {"value": "amethi", "label": "Amethi"},
        {"value": "amroha", "label": "Amroha"},
        {"value": "auraiya", "label": "Auraiya"},
        {"value": "azamgarh", "label": "Azamgarh"},
        {"value": "baghpat", "label": "Baghpat"},
        {"value": "bahraich", "label": "Bahraich"},
        {"value": "ballia", "label": "Ballia"},
        {"value": "balrampur", "label": "Balrampur"},
        {"value": "banda", "label": "Banda"},
        {"value": "barabanki", "label": "Barabanki"},
        {"value": "bareilly", "label": "Bareilly"},
        {"value": "basti", "label": "Basti"},
        {"value": "bhadohi", "label": "Bhadohi"},
        {"value": "bijnor", "label": "Bijnor"},
        {"value": "budaun", "label": "Budaun"},
        {"value": "bulandshahr", "label": "Bulandshahr"},
        {"value": "chandauli", "label": "Chandauli"},
        {"value": "chitrakoot", "label": "Chitrakoot"},
        {"value": "deoria", "label": "Deoria"},
        {"value": "etah", "label": "Etah"},
        {"value": "etawah", "label": "Etawah"},
        {"value": "faizabad", "label": "Faizabad"},
        {"value": "farrukhabad", "label": "Farrukhabad"},
        {"value": "fatehpur", "label": "Fatehpur"},
        {"value": "firozabad", "label": "Firozabad"},
        {"value": "gautam buddha nagar", "label": "Gautam Buddha Nagar"},
        {"value": "ghaziabad", "label": "Ghaziabad"},
        {"value": "ghazipur", "label": "Ghazipur"},
        {"value": "gonda", "label": "Gonda"},
        {"value": "gorakhpur", "label": "Gorakhpur"},
        {"value": "hamirpur", "label": "Hamirpur"},
        {"value": "hapur", "label": "Hapur"},
        {"value": "hardoi", "label": "Hardoi"},
        {"value": "hathras", "label": "Hathras"},
        {"value": "jalaun", "label": "Jalaun"},
        {"value": "jaunpur", "label": "Jaunpur"},
        {"value": "jhansi", "label": "Jhansi"},
        {"value": "kannauj", "label": "Kannauj"},
        {"value": "kanpur dehat", "label": "Kanpur Dehat"},
        {"value": "kanpur nagar", "label": "Kanpur Nagar"},
        {"value": "kasganj", "label": "Kasganj"},
        {"value": "kaushambi", "label": "Kaushambi"},
        {"value": "kheri", "label": "Kheri"},
        {"value": "kushinagar", "label": "Kushinagar"},
        {"value": "lalitpur", "label": "Lalitpur"},
        {"value": "lucknow", "label": "Lucknow"},
        {"value": "maharajganj", "label": "Maharajganj"},
        {"value": "mahoba", "label": "Mahoba"},
        {"value": "mainpuri", "label": "Mainpuri"},
        {"value": "mathura", "label": "Mathura"},
        {"value": "mau", "label": "Mau"},
        {"value": "meerut", "label": "Meerut"},
        {"value": "mirzapur", "label": "Mirzapur"},
        {"value": "moradabad", "label": "Moradabad"},
        {"value": "muzaffarnagar", "label": "Muzaffarnagar"},
        {"value": "pilibhit", "label": "Pilibhit"},
        {"value": "pratapgarh", "label": "Pratapgarh"},
        {"value": "rae bareli", "label": "Rae Bareli"},
        {"value": "rampur", "label": "Rampur"},
        {"value": "saharanpur", "label": "Saharanpur"},
        {"value": "sambhal", "label": "Sambhal"},
        {"value": "sant kabir nagar", "label": "Sant Kabir Nagar"},
        {"value": "shahjahanpur", "label": "Shahjahanpur"},
        {"value": "shamli", "label": "Shamli"},
        {"value": "shravasti", "label": "Shravasti"},
        {"value": "siddharthnagar", "label": "Siddharthnagar"},
        {"value": "sitapur", "label": "Sitapur"},
        {"value": "sonbhadra", "label": "Sonbhadra"},
        {"value": "sultanpur", "label": "Sultanpur"},
        {"value": "unnao", "label": "Unnao"},
        {"value": "varanasi", "label": "Varanasi"}
    ],
    WB: [
        {"value": "alipurduar", "label": "Alipurduar"},
        {"value": "bankura", "label": "Bankura"},
        {"value": "birbhum", "label": "Birbhum"},
        {"value": "cooch behar", "label": "Cooch Behar"},
        {"value": "dakshin dinajpur", "label": "Dakshin Dinajpur"},
        {"value": "darjeeling", "label": "Darjeeling"},
        {"value": "hooghly", "label": "Hooghly"},
        {"value": "howrah", "label": "Howrah"},
        {"value": "jalpaiguri", "label": "Jalpaiguri"},
        {"value": "jhargram", "label": "Jhargram"},
        {"value": "kalimpong", "label": "Kalimpong"},
        {"value": "kolkata", "label": "Kolkata"},
        {"value": "malda", "label": "Malda"},
        {"value": "murshidabad", "label": "Murshidabad"},
        {"value": "nadia", "label": "Nadia"},
        {"value": "north 24 parganas", "label": "North 24 Parganas"},
        {"value": "paschim medinipur", "label": "Paschim Medinipur"},
        {"value": "paschim burdwan", "label": "Paschim Burdwan"},
        {"value": "purba burdwan", "label": "Purba Burdwan"},
        {"value": "purba medinipur", "label": "Purba Medinipur"},
        {"value": "purulia", "label": "Purulia"},
        {"value": "south 24 parganas", "label": "South 24 Parganas"},
        {"value": "uttar dinajpur", "label": "Uttar Dinajpur"}
    ]
}


export default function ManageUsersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const usersQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, "users"), where("role", "==", "User")) : null),
    [firestore, authUser]
  );
  const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersQuery);
  
  const isLoading = isUserLoading || isUsersLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // State for the edit form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editState, setEditState] = useState<string | null>(null);
  const [editDistrict, setEditDistrict] = useState<string | null>(null);


  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditEmail(selectedUser.email);
      const stateValue = states.find(s => s.label === selectedUser.state)?.value || null;
      setEditState(stateValue);
      if (stateValue) {
        const districtValue = districts[stateValue]?.find(d => d.label === selectedUser.district)?.value || null;
        setEditDistrict(districtValue);
      } else {
        setEditDistrict(null);
      }
    }
  }, [selectedUser]);


  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newUser = {
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      email: formData.get("email") as string,
      state: states.find(s => s.value === (formData.get("state") as string))?.label || '',
      district: districts[formData.get("state") as string]?.find(d => d.value === (formData.get("district") as string))?.label || '',
      password: formData.get("password") as string,
      role: 'User' as 'User',
    };

    try {
      await createUser(newUser);
      setDialogOpen(false);
      toast({
        title: "User Added",
        description: `${newUser.name} has been added to the user list.`,
      });
      form.reset();
      setSelectedState(null);
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Add User",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };
  
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    const form = e.currentTarget;
    const formData = new FormData(form);

    const updatedData = {
      name: editName,
      email: editEmail,
      state: states.find(s => s.value === (formData.get("edit-state") as string))?.label || '',
      district: districts[formData.get("edit-state") as string]?.find(d => d.value === (formData.get("edit-district") as string))?.label || '',
    };

    try {
      await updateUser(selectedUser.id, updatedData);
      setEditDialogOpen(false);
      toast({
        title: "User Updated",
        description: `${updatedData.name}'s details have been updated.`,
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Update User",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };


  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast({
        title: "User Deleted",
        description: `User has been successfully deleted.`,
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to Delete User",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };


  const filteredUsers = useMemo(() => {
    let filtered = users || [];

    if (filter !== "All") {
      filtered = filtered.filter(user => user.status === filter);
    }
    
    if (filter === "Inactive") {
       filtered = filtered.filter(user => user.status === "Inactive");
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.mobile.includes(searchTerm)
      );
    }

    return filtered;
  }, [users, searchTerm, filter]);
  
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  }


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>
                    Manage all registered users in the application.
                </CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Fill in the details to add a new user.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" name="name" className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="mobile" className="text-right">
                        Mobile
                      </Label>
                      <Input id="mobile" name="mobile" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input id="email" name="email" type="email" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="state" className="text-right">State</Label>
                        <Select name="state" onValueChange={setSelectedState}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a state" />
                            </SelectTrigger>
                            <SelectContent>
                                {states.map(state => (
                                    <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="district" className="text-right">District</Label>
                        <Select name="district" disabled={!selectedState}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a district" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedState && districts[selectedState] && districts[selectedState].map(district => (
                                    <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input id="password" name="password" type="text" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create User</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-start items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
              />
            </div>
            <Tabs defaultValue="All" onValueChange={(value) => {
                setFilter(value);
                setCurrentPage(1);
            }} className="w-full sm:w-auto">
                <TabsList className="w-full">
                    <TabsTrigger value="All" className="px-2">All</TabsTrigger>
                    <TabsTrigger value="Active" className="px-2">Active</TabsTrigger>
                    <TabsTrigger value="Suspended" className="px-2">Suspended</TabsTrigger>
                    <TabsTrigger value="Inactive" className="px-2">Inactive</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
          
           {/* Desktop Table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading users...</TableCell>
                  </TableRow>
                )}
                {!isLoading && paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.customId}</div>
                    </TableCell>
                    <TableCell>
                      <div>{user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.mobile}</div>
                    </TableCell>
                    <TableCell>
                      <div>{user.state}</div>
                      <div className="text-sm text-muted-foreground">{user.district}</div>
                    </TableCell>
                    <TableCell>₹{(user.balance || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "Active"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                       <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/users/${user.customId}`}><Eye className="h-4 w-4" /></Link>
                       </Button>
                       <Button variant="outline" size="icon" onClick={() => openEditDialog(user)}><Edit className="h-4 w-4" /></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user '{user.name}' and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
           <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-muted-foreground">Loading users...</p>}
            {!isLoading && paginatedUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.customId}</p>
                    </div>
                    <Badge variant={user.status === "Active" ? "secondary" : "destructive"}>
                        {user.status}
                    </Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <div className="text-right">
                            <p>{user.email}</p>
                            <p className="text-muted-foreground">{user.mobile}</p>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <div className="text-right">
                           <p>{user.state}</p>
                           <p className="text-xs text-muted-foreground">{user.district}</p>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Balance:</span>
                        <span>₹{(user.balance || 0).toFixed(2)}</span>
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/users/${user.customId}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(user)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user '{user.name}' and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </Card>
            ))}
           </div>
        </CardContent>
        <CardFooter>
           <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the details for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input id="edit-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-state" className="text-right">State</Label>
              <Select name="edit-state" value={editState || ""} onValueChange={setEditState} required>
                  <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                      {states.map(state => (
                          <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-district" className="text-right">District</Label>
                <Select name="edit-district" value={editDistrict || ""} onValueChange={setEditDistrict} disabled={!editState} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent>
                        {editState && districts[editState] && districts[editState].map(district => (
                            <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
