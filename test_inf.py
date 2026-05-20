"""Comprehensive Raven Nano test — 120+ prompts across all categories."""
from config import cfg
from inference import load_model_for_inference, sample_best
from tokenizers import Tokenizer

tok = Tokenizer.from_file(cfg.TOKENIZER_PATH)
model = load_model_for_inference()

prompts = {
    "Greetings & Small Talk": [
        "hi",
        "hello",
        "hey",
        "what's up",
        "good morning",
        "good night",
        "how are you",
        "I'm back",
        "I'm bored",
        "hello there",
        "hey raven",
        "morning",
        "anyone here",
        "yo",
        "what are you doing",
        "sup",
        "i need a friend",
        "hi there",
        "talk to me",
        "what's new",
        "good evening",
        "miss me",
        "what's happening",
    ],
    "Study & Academics": [
        "i can't study tonight",
        "gonna study now",
        "i'll start tomorrow",
        "i failed the test",
        "i'm procrastinating again",
        "i need to focus",
        "i studied for 5 hours straight",
        "i'm so productive today",
        "school is too hard",
        "i have an exam tomorrow",
        "i don't get this topic",
        "i finished my homework",
        "my grades are dropping",
        "i hate studying",
        "i'm opening my textbook now",
        "i have too much assignments",
        "i skipped my lecture",
        "i am going to ace this test",
        "i can't concentrate",
        "i forgot everything i learned",
    ],
    "Coding & Tech": [
        "coding is impossible",
        "i have a coding interview tomorrow",
        "my code won't run",
        "i'm learning javascript",
        "i built a new website",
        "my laptop is dying",
        "i deleted the wrong file",
        "i love programming",
        "python is the best language",
        "i got a bug in my code",
    ],
    "Health & Fitness": [
        "gonna hit the gym",
        "skipped the gym again",
        "i've been eating junk all day",
        "i'm tired",
        "i only slept 3 hours",
        "i'm on a diet starting monday",
        "i worked out today",
        "i want to lose weight",
        "i ate a whole cake",
        "i'm skipping breakfast",
        "i ran three miles today",
        "i need to drink more water",
        "my muscles are sore",
        "i'm craving fast food",
        "i feel lazy today",
        "i need to eat healthy",
        "i'm doing a cheat day",
        "i walked 10k steps today",
        "i am going to sleep early tonight",
        "i need protein",
    ],
    "Emotional & Deep": [
        "i'm a failure",
        "nobody understands me",
        "everything is going wrong",
        "i'm so tired of everything",
        "why is life like this",
        "i give up",
        "i'm a mess",
        "nobody cares about me",
        "my life is a movie",
        "i can't do anything right",
        "i feel so lonely",
        "nothing makes sense anymore",
        "i want to disappear",
        "i am losing my mind",
        "why does this always happen to me",
        "i'm having a midlife crisis at 20",
        "nobody likes my posts",
        "i am so unlucky",
        "i hate my life right now",
        "i messed up big time",
    ],
    "Daily Life & Random": [
        "i'm going out",
        "it's raining",
        "i have nothing to wear",
        "i'm running late",
        "traffic is crazy",
        "i lost my phone",
        "it's so hot today",
        "i bought new shoes",
        "my car won't start",
        "i need a vacation",
        "i'm watching netflix",
        "i just woke up",
        "i forgot my password",
        "my wifi is slow",
        "i broke my charger",
        "my alarm didn't go off",
        "i need coffee",
        "the food was terrible",
        "i'm moving to a new city",
        "i hate mondays",
    ],
    "Requests & Commands": [
        "say something funny",
        "tell me a joke",
        "roast me",
        "help me",
        "can you help me",
        "be rude but not evil",
        "tell me a secret",
        "make me laugh",
        "give me advice",
        "motivate me",
        "say something nice",
        "insult me",
        "tell me something i don't know",
        "cheer me up",
        "be honest with me",
    ],
    "Knowledge & Impossible Questions": [
        "what is 2+2",
        "what is 47 times 83",
        "explain quantum physics",
        "what's the capital of Peru",
        "define mitochondria",
        "solve this equation for me",
        "what is science",
        "what's the meaning of life",
        "who are you",
        "are you real",
        "do you have feelings",
        "what is love",
        "1+1",
    ],
    "Gibberish & Edge Cases": [
        "dd",
        "sss",
        "k",
        "asdfghjkl",
        "repeat repeat repeat repeat",
        "respond in one line only",
        "",
        "???",
        "...",
        "lol",
    ],
}

total = sum(len(v) for v in prompts.values())
count = 0

for category, prompt_list in prompts.items():
    print(f"\n{'#' * 65}")
    print(f"#  {category.upper()}")
    print(f"{'#' * 65}")
    for p in prompt_list:
        if not p:
            continue
        count += 1
        resp = sample_best(model, tok, p, num_candidates=3)
        print(f"  [{count:3d}] You: {p}")
        print(f"        Raven: {resp}")
        print()

print(f"\n{'=' * 65}")
print(f"Total prompts tested: {count}")
print(f"{'=' * 65}")
