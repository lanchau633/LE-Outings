# LE-Outings

An AI-powered group planning application designed to take the burden of organizing hangouts off of a single person and make gathering with friends effortless.

---

## 📱 Application Context

- **Hackathon Scope**: For the purposes of the hackathon, the application is built as a web-based app hosted locally.
- **Production Vision**: The ultimate goal is to deploy LE-Outings as a native mobile phone application for on-the-go planning and coordination.

## 🎯 Overview & Objectives

Planning a hangout shouldn't feel like a second job. Standard tools (When2meet, group chats, calendars) show *when* people are free, but they don't solve the problem of *what* to do, *where* to eat, or *how* to get there. 

LE-Outings solves this by automatically generating a complete, logistics-aware itinerary based on everyone's individual constraints in under 30 seconds.

## 🚀 Key Features

* **Logistics-Aware Generation**: The AI doesn't just find overlapping times; it builds a full transportation plan (who is driving, who rides with whom) based on daily car availability.
* **Niche Place Discovery**: Bypasses generic search results by pulling from Reddit threads, local blogs, and "hidden gem" listings. It prioritizes spots with high ratings but lower review counts to surface true local favorites.
* **Dietary & Craving Matching**: Scans menu texts and Yelp attributes to ensure restaurant suggestions have clear, verified options for group members with dietary restrictions.
* **Transparent Reasoning**: Explains *why* choices were made (e.g., *"Suggested Korean BBQ because it matches cravings and Jake's car fits everyone"*), building trust and context.
* **Smart Adjustments**: Regenerate plans instantly with natural language constraints (e.g., *"make it budget-friendly"* or *"no seafood"*).

---

## 🔄 Use Case Flow: Friday Hangout Example

1. **Group Setup**: Maya creates a group called *"Weekend Crew"* and invites 5 friends. They fill out quick profile details (e.g., Priya is vegetarian; Jake has a car; two friends don't drive).
2. **Plan Request**: Maya requests a plan for the *"Irvine/Tustin area"* with a note: *"casual dinner, nothing too expensive"*.
3. **Constraint Gathering**: Behind the scenes, the AI aggregates:
   - **Time**: Best overlap is Friday 6-9 PM.
   - **Dietary**: 1 vegetarian (Priya).
   - **Cravings**: Korean food.
   - **Logistics**: 1 car, 4 passengers (covers all 5 members).
4. **Plan Generation**: AI searches for highly rated Korean spots with vegetarian options, checking their open hours.
5. **Output**: An itinerary is generated:
   - Restaurant venue & timeslot (6:30 PM).
   - Menu note confirming vegetarian items for Priya.
   - Transportation breakdown: *Jake drives everyone in his car.*
6. **Adjustments**: Maya can request tweaks (e.g. *"cheaper"*), and the AI updates the suggestion in-place.
7. **Lock-In**: The group confirms and goes!

### 📊 Flow Visualization

![Use Case Flow Visualization](https://media.discordapp.net/attachments/1427139176515502233/1517963729520820284/image.png?ex=6a383163&is=6a36dfe3&hm=cf6cdb1604db4db9ba4377aa91dc83c1b1ae678de42f5b191dfdabc543d8bb4a&=&format=webp&quality=lossless&width=706&height=826)

---

## 🛠️ Technical Scope

### In Scope for Hackathon (v1)
* User profile creation (availability, restrictions, car seats count).
* Group management & friend invites.
* AI-driven plan generation (venues, times, food, carpooling logistics).
* Interactive summary view with reasoning.
* Constrained regeneration ("less driving", "cheaper").

### Out of Scope
* Real-time group chat.
* Bill splitting and expense tracking.
* Google Calendar or external calendar sync.
* Multi-day trip itineraries.
