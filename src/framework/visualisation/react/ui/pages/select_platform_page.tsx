import { MarkdownPrompt } from "../prompts/markdown_prompt";

export const PLATFORMS = [
  {
    name: "Facebook",
    value: "facebook",
    className: "bg-blue-500 hover:bg-blue-600",
  },
  {
    name: "Instagram",
    value: "instagram",
    className: "bg-pink-500 hover:bg-pink-600",
  },
] as const;

const PROJECT_SETTINGS = {
  basePath: "projects/2025-fare-alcohol-study",
}

const DESCRIPTION = `Thank you for your interest in participating in **The Australian Ad Observatory Research Study**. The study is being conducted by researchers  at The Centre of Excellence for Automated Decision Making + Society. The project has been approved by The University of Queensland Human Research Ethics Committee [HE001882]. 

As part of the study, we are asking you to download and donate your Social Media advertising preferences and list of advertisers who use your data to target ads. Your ad preference data, in combination with the ads you collect on the Australian Mobile Ad Toolkit App, help us understand how digital advertising operates.

After you have downloaded your Facebook and/or Instagram Ad Information package, you can select the appropriate button below and submit the downloaded **.zip** file.

Please refer to the **Download Instructions** below (click to expand).

<details class='secondary guide zoomable'>
<summary>Download Instructions - Facebook and/or Instagram</summary>

**Step 1**: Click [this link](https://accountscenter.facebook.com/info_and_permissions/dyi/) to go to the **download your information** section in the official Facebook Accounts Centre and select **Download or transfer information** in the pop-up box. This can also be accessed manually by going to the settings in \`Facebook > Meta Accounts Center > Account Settings > Your information and permissions > Download your information\`.

**Step 2**: Choose the account you'd like to download data from. **For this project, choose the account you use most regularly to browse Facebook and/or Instagram** and click **Next**.

![Screenshot of the user selecting both Facebook and Instagram accounts in the Accounts Centre](./images/data_download_1.jpg)

**Step 3**: In response to How much information do you want? Select Specific types of information

**Step 4 (for Facebook)**: Scroll to the second-to-last item on the list and select **Ads** Information. Ensure no other information is selected, and click **Next**.

**Step 4 (for Instagram)**: Scroll to the last section of **Ads information** and select the three options: **Instagram ads and businesses, Advertising**, and **Ads and topics**. Ensure no other information is selected, and click **Next**.

**Step 5**: Choose **Download to device** and click **Next**. 

**Step 6**: Select file options. Choose:
*	Date range – **All time**
*	Format – **JSON**
*	Media quality – **Low**

![Screenshot of the user selecting the download options in the Accounts Centre](./images/data_download_2.jpg)
 
**Step 7**: Click **Create files** or **Submit request** and wait for them to download. They might download automatically, or you might get an email notification to download the files when they are ready. 

**Step 8**: To download your files, follow the link in the email notification or by visiting the [**Download your information**](https://accountscenter.facebook.com/info_and_permissions/dyi/) section in the official Meta Accounts Centre. Under **Current Activity**, you will see your available download. Click **Download**. *You will need to enter your Facebook/Instagram password to download the files*.

![Screenshot of the user downloading the .zip file from the Accounts Centre](./images/data_download_3.jpg)

**Step 9**: In your downloads folder, a **.zip** file should have downloaded – likely labelled \`facebook/instagram-<your user name>-<date>-<some id>\`. This is the file you need to submit.

</details>`;

/**
 * Replace relative links in the markdown content with absolute links.
 * A relative link is a link that starts with a `./`
 * @param markdownContent The markdown content to process
 */
const replaceRelativeLinks = (markdownContent: string): string => {
  return markdownContent.replace(/(\[.*?\]\()(\/?\.\/)/g, (match, p1, p2) => {
    // Replace the relative path with the absolute path
    return `${p1}${PROJECT_SETTINGS.basePath}/${p2}`;
  });
}

export function PlatformsList() {
  return <>
    {
      PLATFORMS.map((platform) => (
        <a
          key={platform.value}
          href={`?platform=${platform.value}`}
          className={`px-4 py-2 text-white rounded ${platform.className} not-prose`}
        >
          {platform.name}
        </a>
      ))
    }
  </>
}

export default function SelectPlatformPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="zoomable prose max-w-[85ch] dark:prose-strong:!text-white dark:prose-code:!text-white dark:prose-a:!text-white">
        <h1 className="text-2xl !mb-0 font-bold dark:text-white">Social Media Advertising Information Data Donation</h1>
        <MarkdownPrompt className="dark:text-white" content={replaceRelativeLinks(DESCRIPTION)} />
      </div>
      <div className="flex flex-col gap-4 items-center">
        <span className="text-xl font-semibold">Select a platform to donate data:</span>
        <div className="flex gap-4 items-center flex-wrap">
          <PlatformsList />
        </div>
      </div>
    </div>
  );
}