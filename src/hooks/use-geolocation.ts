import { useState } from "react";
import { toast } from "sonner";

export function useGeolocation() {
	const [isLocating, setIsLocating] = useState(false);

	function getCurrentPosition() {
		setIsLocating(true);
		return new Promise<GeolocationPosition>((resolve, reject) => {
			if (!navigator.geolocation) {
				setIsLocating(false);
				toast.error("La geolocalizacion no esta disponible en este navegador");
				reject(new Error("Geolocation unavailable"));
				return;
			}

			navigator.geolocation.getCurrentPosition(
				(position) => {
					setIsLocating(false);
					resolve(position);
				},
				(error) => {
					setIsLocating(false);
					toast.error("No se pudo obtener la ubicacion");
					reject(error);
				},
				{ enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
			);
		});
	}

	return { isLocating, getCurrentPosition };
}
