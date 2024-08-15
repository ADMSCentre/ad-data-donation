The data for the ad information data donation task is hosted on AWS S3, provided by QUT Digital Media Research Centre (DMRC).

# Simple Storage Service (S3)

**Region**: `ap-southeast-2` (Sydney)

**Bucket Name**: `adms-data-donation-meta-ad-information`

# IAM Role

This bucket is accessed by an IAM role, `adms-data-donation-s3-full-access` with `AmazonS3FullAccess` policy, and no permissions boundary.

Role description: `Full access to the S3 bucket for the ADMS data donation task`.

# Lambda Functions

The data donation task uses AWS Lambda functions to interact with the S3 bucket.

**Function Name**: `adms-data-donation-s3-put-object`

**Runtime**: `Python 3.12`

**Architecture**: `x86_64`

**Execution Role**: `adms-data-donation-s3-full-access`

**Advanced Settings**:

- **Enabled** function URL
- **Auth type**: `NONE`
- **Invoke mode**: `BUFFERED`