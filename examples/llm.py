import os
from typing import Any

from devtools import debug as d
from openai import OpenAI
from python_node_editor.display import flush_output_to_frontend


DEFAULT_MODEL = "glm-4.5"
DEFAULT_BASE_URL = "https://api.z.ai/api/coding/paas/v4"
DEFAULT_TEMPERATURE = 0.5


class _LLMHelpers:
    @staticmethod
    def get_api_key(api_key_env_name: str) -> str:
        if not api_key_env_name:
            raise ValueError("api_key_env_name must not be empty")

        api_key = os.getenv(api_key_env_name)
        if not api_key:
            raise ValueError(
                f"Environment variable '{api_key_env_name}' was not found or is empty"
            )

        return api_key

    @staticmethod
    def create_client(api_key_env_name: str, base_url: str) -> OpenAI:
        return OpenAI(
            api_key=_LLMHelpers.get_api_key(api_key_env_name),
            base_url=base_url,
        )

    @staticmethod
    def get_chat_completions_url(base_url: str) -> str:
        normalized_base_url = base_url.rstrip("/")
        return f"{normalized_base_url}/chat/completions"

    @staticmethod
    def get_response_text(response: Any) -> str:
        choices = getattr(response, "choices", None)
        if not choices:
            raise ValueError("The model response did not include any choices")

        content = choices[0].message.content
        if content:
            return content

        raise ValueError("The model response did not include any text output")


def prompt_llm(
    user_prompt: str,
    system_prompt: str = "",
    model: str = DEFAULT_MODEL,
    base_url: str = DEFAULT_BASE_URL,
    api_key_env_name: str = "OPENAI_API_TOKEN",
) -> str:
    print('Prompt sent, waiting for response...')
    flush_output_to_frontend()
    client = _LLMHelpers.create_client(api_key_env_name, base_url)
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})
    
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=DEFAULT_TEMPERATURE,
    )
    return _LLMHelpers.get_response_text(response)
