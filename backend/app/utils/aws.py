import boto3
from botocore.exceptions import ClientError
import logging
from typing import Any, Dict, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class AWSClient:
    """
    A helper client to manage AWS service interactions (S3, Secrets Manager, etc.).
    Uses the credential chain automatically in ECS/AppRunner, or local settings for dev.
    """
    def __init__(self) -> None:
        self.session_params = {}
        if settings.AWS_REGION:
            self.session_params["region_name"] = settings.AWS_REGION
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.session_params["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            self.session_params["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

    def _get_client(self, service_name: str) -> Any:
        try:
            return boto3.client(service_name, **self.session_params)
        except Exception as e:
            logger.error(f"Failed to create boto3 client for {service_name}: {e}")
            raise e

    def upload_to_s3(self, file_content: bytes, object_name: str, bucket_name: Optional[str] = None) -> Optional[str]:
        """
        Uploads a file to an S3 bucket and returns the file URL.
        """
        bucket = bucket_name or settings.BUCKET_NAME
        if not bucket:
            logger.warning("No S3 bucket name provided or configured in settings.")
            return None

        s3_client = self._get_client("s3")
        try:
            s3_client.put_object(
                Bucket=bucket,
                Key=object_name,
                Body=file_content
            )
            # Construct the S3 URL
            region = settings.AWS_REGION or "us-east-1"
            url = f"https://{bucket}.s3.{region}.amazonaws.com/{object_name}"
            logger.info(f"File uploaded successfully to S3: {url}")
            return url
        except ClientError as e:
            logger.error(f"Failed to upload to S3: {e}")
            return None

    def get_secret(self, secret_name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a secret from AWS Secrets Manager.
        """
        import json
        client = self._get_client("secretsmanager")
        try:
            response = client.get_secret_value(SecretId=secret_name)
            if "SecretString" in response:
                return json.loads(response["SecretString"])
        except ClientError as e:
            logger.error(f"Failed to retrieve secret {secret_name}: {e}")
        return None

# Singleton client instance
aws_client = AWSClient()
