#!/usr/bin/env python3
from mnemonic import Mnemonic

try:
    m = Mnemonic('english')
    words_to_check = ['dna', 'rna', 'jesus', 'mrna', 'christ']
    
    print("╔══════════════════════════════════════════════════════════╗")
    print("║  🔍 ПРОВЕРКА ВАШИХ СЛОВ В BIP-39 WORDLIST              ║")
    print("╚══════════════════════════════════════════════════════════╝\n")
    
    for word in words_to_check:
        if word in m.wordlist:
            idx = m.wordlist.index(word)
            print(f"✅ {word.upper():10} → ЕСТЬ в BIP-39! (index: {idx})")
        else:
            similar = [w for w in m.wordlist if w.startswith(word[:2])][:15]
            print(f"❌ {word.upper():10} → НЕТ в BIP-39")
            print(f"   Похожие слова:")
            for s in similar:
                print(f"      • {s}")
            print()
    
    print("\n🔢 Что такое число 99?")
    print(f"wordlist[99] = '{m.wordlist[99]}'")
    print("→ Это может быть ПЯТОЕ известное слово!\n")

except ImportError:
    print("❌ Библиотека mnemonic не установлена!")
    print("Запустите: pip install mnemonic bip32")