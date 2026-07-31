# Health Guide safety contract

## Supported patient tasks

- organise reported symptoms and open the full symptom assessment;
- explain general health concepts in plain language;
- prepare questions for a doctor consultation;
- navigate appointments, nearby hospitals, records and medicine reminders;
- identify emergency wording and show immediate actions;
- provide English, Tamil and Hindi safety responses;
- accept voice dictation and read responses aloud when the browser supports it;
- hand off to a qualified clinician.

## Prohibited outputs

The Health Guide must not:

- claim a diagnosis or rule out a condition;
- prescribe, recommend a personalised dose, or advise starting/stopping a drug;
- claim that an ambulance, doctor, ICU bed or emergency department is confirmed;
- interpret an uploaded image as a medical diagnosis;
- conceal uncertainty, source age or partner failure;
- ask for names, phone numbers, IDs or precise addresses in the prototype.

## Request order

1. Detect emergency and self-harm language.
2. Detect medication-change requests.
3. Extract known symptom terms and run the local pattern model.
4. Offer deterministic care navigation.
5. Only for non-emergency general questions, optionally call a private Ollama
   endpoint.
6. Provide a clinician handoff whenever personalised assessment is needed.

## Production gates

- clinician-reviewed emergency patterns in every supported language;
- adversarial, multilingual and accessibility testing;
- a reviewed health-information corpus with citations and version history;
- authenticated server-side model access and rate limiting;
- consent, retention, deletion and audit controls;
- human escalation service-level agreements;
- incident monitoring, rollback and clinical governance;
- regulatory review before describing the software as a medical device.
