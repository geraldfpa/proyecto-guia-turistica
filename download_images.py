import os
import time
import json
import urllib.request
import urllib.error
import urllib.parse
import random

data = {
    "caribe": [
        ("cahuita.jpg", "Cahuita National Park Costa Rica"),
        ("cahuita-sendero.jpg", "trail Cahuita"),
        ("cahuita-playa-blanca.jpg", "Playa Blanca Cahuita"),
        ("cahuita-arrecife.jpg", "coral reef Cahuita"),
        ("cahuita-mono.jpg", "monkey Cahuita Costa Rica"),
        ("puerto-viejo.jpg", "Puerto Viejo de Talamanca"),
        ("puerto-viejo-playa-cocles.jpg", "Playa Cocles"),
        ("puerto-viejo-punta-uva.jpg", "Punta Uva Costa Rica"),
        ("puerto-viejo-pueblo.jpg", "Puerto Viejo town"),
        ("puerto-viejo-bicicleta.jpg", "Puerto Viejo Costa Rica bicycle"),
        ("tortuguero.jpg", "Tortuguero National Park"),
        ("tortuguero-canales.jpg", "Tortuguero canals"),
        ("tortuguero-tortuga.jpg", "sea turtle Costa Rica"),
        ("tortuguero-selva.jpg", "jungle Tortuguero"),
        ("tortuguero-aves.jpg", "toucan Tortuguero Costa Rica"),
    ],
    "guanacaste": [
        ("tamarindo.jpg", "Tamarindo Costa Rica"),
        ("tamarindo-surf.jpg", "surfing Tamarindo"),
        ("tamarindo-atardecer.jpg", "sunset Tamarindo Costa Rica"),
        ("tamarindo-playa.jpg", "beach Tamarindo Costa Rica"),
        ("tamarindo-tortuga-baula.jpg", "leatherback turtle Costa Rica"),
        ("rincon-vieja.jpg", "Rincon de la Vieja volcano"),
        ("rincon-vieja-fumarolas.jpg", "fumaroles Rincon de la Vieja"),
        ("rincon-vieja-cascada.jpg", "waterfall Costa Rica"),
        ("rincon-vieja-barro.jpg", "mud pots Rincon de la Vieja"),
        ("rincon-vieja-sendero.jpg", "trail Rincon de la Vieja"),
        ("conchal.jpg", "Playa Conchal Costa Rica"),
        ("conchal-arena.jpg", "shells Playa Conchal"),
        ("conchal-agua.jpg", "Playa Conchal water"),
        ("conchal-snorkel.jpg", "snorkeling Costa Rica"),
        ("conchal-panoramica.jpg", "Playa Conchal panoramic"),
    ],
    "central": [
        ("volcan-poas.jpg", "Poas Volcano crater"),
        ("poas-crater.jpg", "crater Poas Costa Rica"),
        ("poas-laguna-botos.jpg", "Laguna Botos Costa Rica"),
        ("poas-bosque-nuboso.jpg", "cloud forest Poas Costa Rica"),
        ("poas-sendero.jpg", "trail Poas Volcano"),
        ("valle-orosi.jpg", "Orosi Valley Costa Rica"),
        ("orosi-iglesia.jpg", "Orosi church Costa Rica"),
        ("orosi-ruinas-ujarras.jpg", "Ujarras ruins Costa Rica"),
        ("orosi-valle-panoramica.jpg", "Orosi Valley Costa Rica panorama"),
        ("orosi-aguas-termales.jpg", "hot springs Costa Rica"),
        ("volcan-irazu.jpg", "Irazu Volcano crater"),
        ("irazu-crater-verde.jpg", "Irazu green lake Costa Rica"),
        ("irazu-panoramica.jpg", "Irazu Volcano Costa Rica"),
        ("irazu-sendero.jpg", "trail Irazu Volcano Costa Rica"),
        ("irazu-flora.jpg", "flora Irazu Volcano Costa Rica"),
    ],
    "pacifico-sur": [
        ("manuel-antonio.jpg", "Manuel Antonio National Park Costa Rica"),
        ("manuel-antonio-playa.jpg", "beach Manuel Antonio Costa Rica"),
        ("manuel-antonio-mono.jpg", "capuchin monkey Manuel Antonio Costa Rica"),
        ("manuel-antonio-sendero.jpg", "trail Manuel Antonio Costa Rica"),
        ("manuel-antonio-vista-aerea.jpg", "Manuel Antonio Costa Rica aerial"),
        ("uvita.jpg", "Uvita Costa Rica"),
        ("uvita-cola-ballena.jpg", "whale tail Uvita Costa Rica"),
        ("uvita-ballena-jorobada.jpg", "humpback whale Costa Rica"),
        ("uvita-cataratas-nauyaca.jpg", "Nauyaca waterfalls Costa Rica"),
        ("uvita-playa.jpg", "beach Uvita Costa Rica"),
        ("corcovado.jpg", "Corcovado National Park Costa Rica"),
        ("corcovado-selva.jpg", "jungle Corcovado Costa Rica"),
        ("corcovado-guacamaya.jpg", "scarlet macaw Costa Rica"),
        ("corcovado-playa.jpg", "beach Corcovado Costa Rica"),
        ("bahia-drake-isla-cano.jpg", "Cano Island Costa Rica"),
    ]
}

def get_fallback_image(query):
    # Using loremflickr directly
    kw = urllib.parse.quote(query.replace(' ', ','))
    return f"https://loremflickr.com/800/600/{kw}"

base_dir = "/Users/m1pro/Desktop/Aprendizaje/UCR/Multimedios/project/Proyecto-Guia-Turistica/assets/img"

for region, images in data.items():
    region_dir = os.path.join(base_dir, region)
    os.makedirs(region_dir, exist_ok=True)
    
    for filename, query in images:
        filepath = os.path.join(region_dir, filename)
        if os.path.exists(filepath):
            if os.path.getsize(filepath) > 5000:
                print(f"Skipping {filename}, already downloaded.")
                continue
            
        print(f"Downloading for {filename}...")
        img_url = get_fallback_image(query)
            
        try:
            req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                with open(filepath, 'wb') as f:
                    f.write(response.read())
        except Exception as e:
            print(f"Failed to download image {filename}: {e}")
        time.sleep(1)

print("Done downloading images.")
