# Temporal

## Design Decisions

When developing the AI / Translation Response, I had to think about how should the information be present. I had two different approaches.

### Approach 1
```json
{
    "service": "OpenAI",
    "englishText": "now",
    "possibleTranslation": [
        {
            "chineseText": ["而", "家"],
            "jyupting": ["ji4", "gaa1"],
            "cangjie": {
                "chineseCode": ["一月中中", "十一尸人"],
                "englishCode": ["MBLL", "JMSO"]
            }
        },
        {
            "chineseText": ["現", "在"],
            "jyupting": ["jin6", "zoi6"],
            "cangjie": {
                "chineseCode": ["一土月山山", "大中土"],
                "englishCode": ["MGBUU", "KLG"]
            }
        }
    ]
}
```

### Approach 2
```json
{
  "service": "OpenAI",
  "englishText": "now",
  "possibleTranslation": [[
    {
      "chineseText": "而",
      "jyupting": "ji4",
      "cangjie": {
        "chineseCode": "一月中中",
        "englishCode": "MBLL"
      }
    },
    {
      "chineseText": "家",
      "jyupting": "gaa1",
      "cangjie": {
        "chineseCode": "十一尸人",
        "englishCode": "JMSO"
      }
    }
  ], [
    {
      "chineseText": "現",
      "jyupting": "jin6",
      "cangjie": {
        "chineseCode": "一土月山山",
        "englishCode": "MGBUU"
      }
    },
    {
      "chineseText": "在",
      "jyupting": "zoi6",
      "cangjie": {
        "chineseCode": "大中土",
        "englishCode": "KLG"
      }
    }
  ]]
}
```
I end up choosing *Approach 2* because I'll let the front-end stich everything together. 