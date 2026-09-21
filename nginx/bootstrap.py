import os
from pathlib import Path

from jinja2 import Environment, FileSystemLoader


def sites_default_conf(env, template_vars):
    path = Path("/etc/nginx/includes/sites-default.conf")
    template = env.get_template(f"{path.name}.j2")
    config = template.render(template_vars)
    path.write_text(config)

def nginx_conf(env, template_vars):
    path = Path("/etc/nginx/nginx.conf")
    template = env.get_template(f"{path.name}.j2")
    config = template.render(template_vars)
    path.write_text(config)

def prepare_template_vars(environ):
    additional_server_names = environ.get("ADDITIONAL_SERVER_NAMES", "")

    return {
        "TRUSTED_NETWORK": environ.get("TRUSTED_NETWORK", False),
        "SERVER_HOSTNAME": environ.get("SERVER_HOSTNAME", ""),
        "ADDITIONAL_SERVER_NAMES": [item.strip() for item in additional_server_names.split(",") if item.strip()],
    }

def main():
    env = Environment(loader=FileSystemLoader("./etc/nginx/conf.d/templates"))

    # Render config
    print("Render config")
    template_vars = prepare_template_vars(os.environ)
    sites_default_conf(env, template_vars)
    nginx_conf(env, template_vars)


if __name__ == "__main__":
    main()
