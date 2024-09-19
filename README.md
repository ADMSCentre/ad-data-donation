<p align="center">
  <a href="https://www.admscentre.org.au/">
    <img width="40%" height="40%" src="https://www.unimelb.edu.au/__data/assets/image/0006/3625854/ADM-S-Logo.png">
  </a>
   <a href="https://www.uq.edu.au/">
    <img width="40%" height="40%" src="https://usercontent.one/wp/studyoptions.com/wp-content/uploads/2023/08/UQlogo.png">
  </a>
</p>

> [!NOTE]
> This data donation platform is adapted from the [data donation task for Next](https://github.com/d3i-infra/data-donation-task) under the [D3I Project](https://datadonation.eu/d3i/project-d3i), configured to work with a custom backend.
>
> For more information regarding the original data donation task, please refer to the [original repository](https://github.com/d3i-infra/data-donation-task), [datadonation.eu](https://datadonation.eu/) and [this paper](https://joss.theoj.org/papers/10.21105/joss.05596) [1].
>
> **Reference**:
>
> [1] Boeschoten et al., (2023). Port: A software tool for digital data donation. Journal of Open Source Software, 8(90), 5596, https://doi.org/10.21105/joss.05596

# Meta Ads Information Donation Platform

This platform supports the research project **Digital advertising and cultures of alcohol and gambling consumption on social media platforms**. The study is being conducted by researchers at [the University of Queensland](https://www.uq.edu.au/) and was funded by the [Foundation for Alcohol Research and Education Ltd](https://fare.org.au/). This study adheres to the Guidelines of the ethical review process of The University of Queensland and the National Statement on Ethical Conduct in Human Research (Ethics ID number: 2023/HE002131).

Data donation allows researchers to invite participants to share their data download packages (DDPs).
A major challenge is however that DDPs potentially contain very sensitive data, and often not all data is needed to answer the specific research question under investigation.
To circumvent these challenges, the following framework was developed:

1. The research participant requests their personal DDP at the platform of interest.
2. They download it onto their own personal device.
3. By means of local processing (i.e. in the browser of the participant) only the features of interest to the researcher are extracted from that DDP.
4. The participant inspects the extracted features after which they can consent (or decline) to donate.

## How does the data donation task work?

**The design of the data donation task**

The data donation task has reusable components (such as: a screen that prompts the participant to submit their DDP and a screen with tables that the participants need to review prior to donation) that you can use and combine/rearrange in creative ways to make your own study.
These components are combined in a Python script that is created by the researcher or a research engineer.

On a high level the script works as follows:

1. The Python script determines which user interface (UI) component needs to be shown to the participant
2. The participant interacts with the UI component on screen. Whenever the participant is done interacting with the UI component, the result of that interaction is returned to the script.
3. The script handles the return result and determine the next UI component that the participant needs to see or interact with, go back to step 1 until the end of the donation flow.

**Technical details**

The data donation task is a single-page web application that runs in the browser of the participant and utilise a serverless architecture.

The data donation task is written in TypeScript and uses React as a front-end library that dynamically renders the UI components depending on events triggered by a `Pyodide` Python interpreter running in the browser. The Python interpreter is used to process the DDPs and to determine the next UI component that the participant needs to see or interact with.

Donations are stored in an AWS S3 bucket under Queensland University of Technology (QUT)'s Digital Media Research Centre (DMRC) account. Interactions with the S3 bucket are facilitated by AWS Lambda functions.

## Installation of the data donation task

> [!IMPORTANT]
>
> On Windows, it is recommended to use the Windows Subsystem for Linux (WSL) to run the data donation task.

In order to start a local instance of the data donation task go through the following steps:

1. Pre-requisites

   - Fork or clone this repo
   - Install [Node.js](https://nodejs.org/en)
   - Install [Python](https://www.python.org/)
   - Install [Poetry](https://python-poetry.org/)

2. Install dependencies & tools:

   ```sh
   npm install
   ```

3. Start the local web server:

   ```sh
   npm run start
   ```

4. You can now go to the browser: [`http://localhost:3000`](http://localhost:3000).
