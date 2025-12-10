
# Revive Blogpost

## Introduction: Motivations Behind the Project

Revive is a mobile application designed to help users refurbish used furniture. This project began from noticing the large amount of furniture left on the streets of Westwood during UCLA's move-out period. Many pieces were in like-new condition or had minor damages that were easy to fix, yet they still ended up discarded. This pattern happens every year, indicating that something about the move-out process or the condition of these items makes disposal the outcome for many people, even when the furniture is still usable.

UCLA Sustainability estimates that an average student creates 640 pounds of trash annually, most of it during move-out week. This includes furniture, clothing, books, and other items that could have been reused. On a broader scale, the U.S. The Environmental Protection Agency reports that over 9.7 million tons of furniture are discarded annually in the United States.

At the same time, students, renters, and low-income households consistently look for affordable furniture options. Many rely on inexpensive, low-quality items that break quickly or cannot be repaired. This creates a cycle where people discard items that could be refurbished, while simultaneously needing low-cost furniture themselves.

The mismatch between waste and need motivated the idea behind Revive. The goal is to make the refurbishing process clearer, easier, and more accessible. If people had a simple way to identify a furniture issue, understand whether it is fixable, and get a straightforward repair plan, more items could be saved and reused rather than thrown away.

In Revive, we want to focus on lowering the initial barrier for users. Most people are not opposed to refurbishing; they just do not know where to start. Revive aims to support users by providing information and guidance on how to identify furniture issues and understand potential repair options. The goal of the app is to make the refurbishment process clearer and more approachable, especially for people who might be interested in reusing or upgrading secondhand items but may not know where to begin.

## User Research

Our user research was conducted in two rounds: an initial "pilot" round and a second, more refined one.The goal was to understand the residents' pain points, motivations, and needs when navigating the process of fixing secondhand items.

### Methods Used

We conducted semi-structured interviews with both users and experts; this method allowed us to follow a consistent set of questions while still being flexible enough to follow up on participant-specific experiences. For participants who already had refurbishing experience, we used think-aloud interviews to observe their process and hear their reasoning in real time. This choice was grounded in four core research questions:

- How do we help or assist residents in refurbishing furniture?
- What motivates residents to refurbish furniture?
- How do we encourage residents to refurbish furniture?
- How do residents refurbish furniture?

### Recruitment and Participants

Our target users were residents living in apartments, dorms, and other rented housing. We initially recruited through social networks, specifically the UCLA campus. Our two rounds included varying levels of experience refurbishing second-hand items from beginners to more experienced refurbishers. Interviews were held either in person or over Zoom, depending on the interviewee's availability. At least two team members attended each session, rotating roles between interviewer and note-taker.

### Findings from Round 1

In our first round of interviews, we realized that there was confusion in terminology. Participants did not always understand what "refurbish" meant. Two interviewees thought "items" referred to clothing rather than furniture. This showed us that our protocol required clearer language. We added a simple definition of "refurbish" to ensure a shared understanding before beginning each interview. We noticed that questions about motivations, barriers, and decision-making worked well. Participants gave detailed explanations about what shaped their choices when encountering or acquiring used furniture. However, questions such as "What was the last piece of furniture you acquired?" did not generate meaningful insight. It did not tell us anything about how they make refurbishment decisions. This led us to remove and reorder questions to improve interview flow.

### Findings from Round 2

Across all interviews, several consistent themes emerged:

- Users are not necessarily unwilling to refurbish furniture; instead, they experience uncertainty at the very first step. Many participants described walking past used or discarded furniture and feeling unsure about whether the item was worth picking up. They did not know how to identify the type of damage, how difficult a repair might be, or whether they had the right tools. This uncertainty often led them to ignore an item entirely.
- Participants also noted that online resources like DIY tutorials on YouTube or Pinterest were overwhelming, too broad, or geared toward people with more experience. Users said they wanted instructions that matched the specific issue of the furniture piece in front of them rather than generic repair advice. This pointed to a clear need for targeted, specific support rather than long tutorials. Several interviewees mentioned that having a "helping hand" to guide them through the process would be helpful. This desire for step-by-step help came up across both beginners and intermediate refurbishers.
- Time and convenience were also pain points for many users. Refurbishing often takes a lot of time, which they may not have. Although we cannot solve this issue directly, we can incorporate an evaluation stage that shows the difficulty level and estimated time needed to complete a repair. This would allow users to make quick decisions about whether to take or repair a piece of furniture. It also means the design has to be fast, simple, and low-effort; users will not sit through long tutorials, so the app must provide quick assessments and digestible steps to minimize effort and reduce cognitive load.
- Many interviewees mentioned using Pinterest or similar platforms to explore furniture ideas and aesthetics. This showed that refurbishing is not strictly a technical process; it also involves creativity in imagining what a piece could become. For more experienced users, this inspiration stage is central to their decision-making process. Beginners found inspiration motivating as well because it helped them visualize potential outcomes.

The research revealed clear differences in needs between beginner users and experienced refurbishers. Beginners needed simple, confidence-building support and a way to identify what is wrong, where to start, what tools are needed, and so on. They often mentioned not knowing where to start and wanting guidance throughout the process. Experienced users, on the other hand, wanted new ideas, new techniques, and access to a community or source of inspiration. Both groups expressed a need for support, but in different forms, which directly informed how we structured our personas and design goals moving forward.

### Personas

**Persona 1: Michelle**

Michelle occasionally refurbishes items to save money and because she enjoys the process. She is familiar with cleaning, basic repairs, and picking up secondhand pieces from marketplace sites or the street.

Goals and motivations:

- Create a personalized home environment.
- Save money on furniture.
- Learn new techniques and design styles.
- Views refurbishing as a rewarding task that helps her feel more connected to the things she owns.

Pain points:

- Lacks fresh ideas or creative direction.
- Limited access to tools and materials.
- Occasionally unsure where to start.

Needs:

- Ideas or inspiration boards.
- Workshops or tutorials to learn new techniques.
- Easier access to free or affordable supplies.
- Community that shares creative refurbishing projects.

**Persona 2: Brandon**

Brandon recently moved into an apartment complex with five other people. He has no prior refurbishing experience but is interested in learning because he sees it as a sustainable and affordable alternative to buying new furniture. He often notices discarded furniture on the street that has potential but feels unsure where to start, what items are worth refurbishing, or how to find the time to do it.

Goals and motivations:

- Save money on furniture.
- Personalize his living space.
- Learn basic refurbishing skills.

Pain points:

- Limited access to tools and workspace.
- Unsure where to start or which items are worth refurbishing.
- Finds refurbishing time-consuming.

Needs:

- Clear, beginner-friendly steps
- Access to shared tools and materials.
- Simple guidance on identifying items worth refurbishing and estimated time.

### Problem Statement

Users frequently encounter used or discarded furniture that could be repaired or refurbished, but they did not know where to start, how to assess damage, or whether a repair was realistic. From the user research, we found that current platforms (like Pinterest or YouTube) offer aesthetic inspiration but fail to provide actionable, step-by-step guidance or local support networks. This leaves beginners unsure about what type of damage they are looking at, whether the damage is fixable, how difficult or time-consuming the repair would be, and what tools or materials are required. Because beginners do not have the knowledge to answer these questions, they often ignore repairable items altogether. This combined with limited time and convenience creates a barrier to start refurbishing even for simpler tasks. As a result, many usable pieces are discarded, and people miss out on affordable and sustainable furniture options. This pushed the project toward designing features that offer quick evaluations, difficulty levels, estimated repair times, and clear, step-by-step guidance.

With Revive, the goal is to help users rethink how they approach discarded furniture. Instead of immediately assuming something should be thrown away, the app gives users a second look by providing an automated assessment that identifies damage, suggests necessary tools or materials, and outlines a clear, step-by-step repair plan. Sustainability becomes much more achievable when people have the right support and guidance. By making refurbishing clearer and easier to start, the app aims to make the process feel approachable and doable. It empowers more people to repair rather than discard and supports both beginners and experienced refurbishers in ways that align with their different needs.

## Design Goals

<img width="1600" height="1000" alt="image" src="https://github.com/user-attachments/assets/46e59d5e-c08d-4688-92d3-b2aa9e8d454f" />

There were two design goals in mind for this project. The first was to allow users to find refurbishing inspiration easily. Through our user research, we found that many struggled to find meaningful inspiration when refurbishing furniture. Users reported that places to find inspiration, like Pinterest or Google search results, often show only the furniture item, with little context of how it fits in their home or overall user case. From an expert interview, they mentioned the importance of having a clear direction for what they want to do with refurbishing an item, hence the need for a good inspiration source. We wanted to design something that provided contextual and personalized ideas to allow users to visualize how their own refurbished furniture item can fit into their own environment. This would also hopefully motivate users towards sustainable refurbishing practices.

The other goal was to give users access to tutorials and guides on how to refurbish their furniture. From our user research, users with little to no experience with refurbishing often lacked clear guidance on the process. They often would find pieces of furniture that they would want to refurbish, but were unclear on how or where to start. This highlighted a clear gap in accessible, step-by-step refurbishing knowledge for users. There was a clear need for tutorials and guides that would empower users to confidently repair and restore items on their own.

These design goals remained roughly the same following instructor feedback. We kept these two design goals as we believed from user research that they were the most crucial aspects of our system that we needed to consider. Along with this, we wanted to make sure that our system was also intuitive and easy to use. This would allow users to focus on refurbishing and removing any friction points that may arise from using our system to aid in their refurbishing process. We wanted inspiration to be organic and community-driven, and tutorials to be personalized and accessible to one's needs.

This ultimately led us towards having our system be a mobile app, as it allowed us to address these design goals in the best manner. We wanted our system to combine various aspects of social media platforms while also utilizing visual search and image analysis tools. The social media aspect allowed for the community-driven inspiration, while the visual search and image analysis would be how we deliver personalized refurbishing guides to users.

## System Design and Implementation

Revive is a React Native mobile app built with Expo and TypeScript. It uses Supabase for the backend, which includes authentication and data storage, and utilizes OpenAI's GPT-4o vision capabilities to do image analysis. The app structure follows a three-tab navigation system, done through Expo Router, which includes a camera tab to scan and upload furniture photos, a feed tab for viewing community furniture posts, and a profile tab.


<img width="394" height="782" alt="image" src="https://github.com/user-attachments/assets/ebf81e11-9676-4e5b-a88d-1a0bc9996d17" />


Figure shows Revive Tab.

Upon opening the application, users are prompted to either sign up or log in with their email and password. React Context handles a user session. For the camera pane, Expo Camera is used to capture the images. Scanning an image requires a user to first take a photo, or select a photo from their camera roll, and then these images are converted into a Base64 encoding in order to be analyzed by the GPT-4o model. Two kinds of analysis is done by the mode. First, the model verifies that a furniture item is in the image, and then a further analysis is done to detect the type, material, color, condition, and repair issues of the furniture item. These details are returned as JSON data, which is displayed to the user through an animated swipe-up page. This page contains two tabs, one named "Revive" which displays the furniture item information and issues, and one named "Inspo," which returns similar items uploaded by other users. The "Revive" tab allows users to select or input issues detected by the model and generate repair plans based on these issues. These repair plans include step-by-step guides along with materials required for the repair. Users are able to save these repairs as either images or in the app itself. The "Inspo" tab, which returns similar furniture items works by generating vector embeddings of the image through OpenAI's text-embedding model, and stores this high-dimensional vector into Supabase using the pgvector extension. This allows for cosine similarity matching to return similar images. Users are also able to upload images of their furniture to the app using the "Post" feature on the camera page, which is then displayed both in the "Feed" page and "Created" tab in the profile page. Image analysis is also done on the image before upload. The "Feed" page displays the most recent furniture uploads by users. Posts are able to be saved by a user and can be commented on by a user. The profile page contains all the user uploads along with saved posts and tutorials, each in its own tab.

The database schema includes tables for furniture images (which includes metadata for posts, vector embeddings, and issues generated by the model), user profiles, saved posts, saved tutorials, and comments, which are protected by Row Level Security policies to only allow users to modify them.

<img width="376" height="770" alt="image" src="https://github.com/user-attachments/assets/730ce05b-46a9-4901-94db-5f9eda17411d" />

Figure shows how database of furniture images are displayed in the app.

## Evaluation Question, Methods, and Analysis Approach

Our evaluation showcases how effectively users can understand and complete the refurbishing flow in Revive. This question emerged from earlier critiques emphasizing the importance of clarity, particularly at the beginning of the user journey. To examine this question, we conducted a usability study in which participants completed the full sequence of scanning an item, reviewing identified issues, selecting relevant issues, and generating a repair plan. Throughout this process, participants were asked to think aloud so that we could gain insight into their cognitive processes, assumptions, and emotional reactions.

The evaluation method incorporated task observation, performance metrics, and post-task reflection. Participants were observed for the number of taps required to complete each step, the frequency of backtracking, the amount of time spent on scanning, reviewing, and selecting issues, and any repeated attempts to generate a plan. We also recorded error patterns such as misclicks or moments in which users hesitated or misunderstood interface elements. After completing the task, participants filled out a survey using a five-point Likert scale to assess clarity, confidence, ease of navigation, and perceived helpfulness of the repair plan. Finally, participants participated in an interview discussing what aspects of the app felt intuitive, what areas caused confusion, and what improvements they would expect in a future iteration.

<img width="2048" height="1039" alt="image" src="https://github.com/user-attachments/assets/e186f0de-3d4b-4480-b898-898d82a26fc1" />

Figure shows one of the survey question results we conducted.

The analysis approach combined quantitative measures of task efficiency with qualitative observations and user feedback. We analyzed task completion times to assess whether the flow was intuitive and whether users understood how to progress between stages. Backtracking and misclicks provided insight into points of confusion or unclear design elements. Survey data allowed us to cross-reference these behavioral observations with users' self-reported confidence and satisfaction. The think-aloud recordings and post-task interviews provided depth by revealing users' expectations, assumptions, and sources of uncertainty, enabling a more complete understanding of where the design supported or hindered the refurbishing process. Together, these data allowed us to evaluate the effectiveness of Revive's core flow and identify actionable areas for improvement.

## Findings

The evaluation revealed several important insights about how users interact with Revive's refurbishing flow. Overall, users consistently expressed that the scanning feature felt natural and intuitive. Many commented that the visual framing and real-time feedback helped them position the furniture effectively, reducing uncertainty at the very first step. The identification stage also performed well, with users responding positively to the visual markers placed on areas of detected damage. Participants described these markers as helpful cues that validated their observations or drew attention to issues they had not previously noticed. This validation contributed to increased confidence, especially among users who had little prior refurbishing experience.

However, several aspects of the interface produced confusion or hesitation. The initial navigation screen was a frequent point of difficulty. Users were sometimes unsure whether they were supposed to upload an image or use the live camera, and some reported that the text labels were too small or insufficiently contrasted against the background. This issue reflected earlier critiques regarding the onboarding process, demonstrating that revisions were still needed. Participants also requested greater clarity in distinguishing between minor and major issues during the identification phase. Although the AI successfully highlighted damage, users occasionally expressed uncertainty about the severity of the detected issues and wanted more contextual information regarding whether a repair was optional or necessary.

One notable finding was the strong reliance on visual elements throughout the process. Participants frequently used the highlighted issue markers as anchors for understanding the repair task. When markers were missing or ambiguous, users became noticeably less confident. Another important finding was that users appreciated the generated repair plan but often wished for the ability to save or bookmark the plan for later. Without such a feature, users felt pressure to complete repairs immediately or risk losing access to the information. This feedback demonstrated the importance of extending the app's functionality beyond real-time guidance to ongoing support.

Finally, several participants mentioned that the tutorial content and instructions were clear but sometimes felt disconnected from the specific item they were repairing. This indicated a need for more personalized or contextualized guidance in the future. Overall, the findings showed that while Revive's core flow is intuitive and supportive, improvements are needed in navigation, clarity of issue severity, and long-term accessibility of tutorial content.

## Discussion, Takeaways, Limitations, and Future Work

The evaluation of Revive demonstrated that users generally found the scanning and issue identification features helpful and intuitive, reinforcing the effectiveness of the core flow we designed. Users reported increased confidence in their ability to assess furniture and begin repairs, which is a central goal of the application. However, the study also highlighted several challenges that require attention. One major takeaway is that the onboarding experience plays a crucial role in shaping how users interact with the rest of the app. Confusion at the beginning of the flow can undermine user confidence, even if later steps feel intuitive. Strengthening the clarity of initial navigation, improving text visibility, and offering brief, guided onboarding could ease users into the experience more smoothly.

Another takeaway is the importance of contextual information. While users appreciated the system's ability to detect issues, they wanted additional explanation regarding severity, causes, and implications. This suggests that the app should not only identify issues but also educate users about them in a deeper, more nuanced way. Doing so would help transform Revive into a tool that builds long-term refurbishing confidence, not just a one-time guide. Users also expressed a desire for more personalization, such as saved tutorials or customizable repair plans. Supporting such features would allow Revive to become a sustained companion tool rather than a one-off interaction.

A number of limitations emerged during the evaluation. The sample size was relatively small, and participants were constrained to a controlled environment rather than a real-world refurbishing context. This likely affected their perception of difficulty and may not fully capture how users behave when repairing heavy or complex items in their homes. Another limitation is that the image recognition model was tested primarily on straightforward furniture types and may not generalize well to unusual materials, intricate carvings, or multi-component pieces. Additionally, the repair plans are based on modular templates, which may not perfectly fit all possible combinations of identified issues.

Future work on Revive should focus on refining the onboarding process, increasing visual clarity, and implementing a save feature for tutorials and repair plans. Additional efforts could be directed toward improving the AI's understanding of issue severity, differentiating between cosmetic and structural problems, and creating adaptive tutorials that respond to user skill level. There is also room to explore integrating community features, such as user-shared refurbishing stories or the ability to ask for human advice.

The evaluation raised several new questions. One pressing question is how accurate the issue detection needs to be to maintain user trust. If the model occasionally misses minor issues or incorrectly identifies damage, will users lose confidence in the app altogether? Another question involves long-term behavior: does using Revive repeatedly increase users' willingness to refurbish furniture outside the app's guidance? Finally, we must consider how Revive can support users with different abilities, tools, and backgrounds. Expanding the system to account for variations in user skill levels and resources could significantly broaden its impact.

Through the development of Revive, we learned that mistakes early in design often stem from assuming certain user knowledge that does not exist. Our earliest prototypes did not sufficiently guide users through the first interaction, which produced confusion that might have been avoided through clearer visual cues and onboarding. We also learned the importance of iterative testing; each usability round uncovered new insights that shaped later design decisions. By reflecting on these lessons, we can continue improving Revive into a more supportive, empowering tool for users seeking to refurbish and restore second-hand items.
