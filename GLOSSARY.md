# Unlost

A personal "save it, find it later" library: a user saves links, notes and images the
moment they notice them, then finds them again by describing what they remember.

## Library

**Item**:
One thing a user has saved: a Link, a Note or an Image.
_Avoid_: capture, entry, bookmark, save

**Link**:
An Item whose main content is a web address.
_Avoid_: bookmark, URL item

**Note**:
An Item that is only text the user wrote.
_Avoid_: memo, text item

**Image**:
An Item built around a picture the user uploaded.
_Avoid_: screenshot, photo, picture

**Library**:
All the Items belonging to one user. Each user has exactly one, with no folders or sub-collections.
_Avoid_: collection, folder, dashboard

**Description**:
The free text a user writes on an Item, saying what it is or why they kept it. Any type of Item can have one.
_Avoid_: note, body, content

**Source**:
The web address an Item came from. Any type of Item can have one.
_Avoid_: url, link

## Enrichment

**Enrichment**:
The background step after an Item is saved that adds Tags, Search keywords and, for an Image, an Image caption, so that Search can find it later.
_Avoid_: processing, indexing, tagging

**Tags**:
Short topic labels that Enrichment writes on an Item and the user sees but doesn't edit.
_Avoid_: labels, categories, topics

**Search keywords**:
Hidden synonyms, broader topics and translations added to an Item so that Search matches words the Item itself doesn't use. Never shown to the user.
_Avoid_: hidden tags, keywords, metadata

**Image caption**:
A hidden description of an Image's picture, written by the model and used only by Search and Enrichment. Never shown to the user.
_Avoid_: alt text, image description

## Finding

**Search**:
Finding Items by describing them in your own words. Results are ranked and split into Strong and Possible matches. Without a working Gemini key, Search matches on words only, not on meaning.
_Avoid_: ask, query, lookup, keyword search

**Filter**:
Narrowing the visible Library down, instantly and without ranking, to Items of a given type or whose own text contains a given word.
_Avoid_: search, find

**Strong match**:
A Search result that clearly stands out from the rest of the Library for that Search, or contains the words searched for.
_Avoid_: hit, top result

**Possible match**:
A weaker Search result, shown folded away below the Strong matches.
_Avoid_: weak match, related, fuzzy match

**Answer**:
A short text written from the Strong matches of a Search alone, citing each Item it uses.
_Avoid_: AI summary, summary, RAG response

## People and access

**User**:
A person with their own Library. A User is the owner of every Item in it.
_Avoid_: account, member, customer

**Invite code**:
A single-use code that lets exactly one person become a User. Sign-up is only possible with one.
_Avoid_: invitation, referral, token, invite link

**Gemini key**:
A User's own Google Gemini API key. Without one, there is no Enrichment, no Answer, and Search matches on words only.
_Avoid_: API key, token, credentials
