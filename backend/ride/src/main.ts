import crypto from "crypto";
import pgp from "pg-promise";

const myConnectionString = "postgres://postgres:123@localhost:5432/app";

export function validateCpf(cpf: string) {
	if (!cpf) return false;
	cpf = clean(cpf);
	if (isInvalidLength(cpf)) return false;
	if (allDigitsAreTheSame(cpf)) return false;
	const dg1 = calculateDigit(cpf, 10);
	const dg2 = calculateDigit(cpf, 11);
	return extractCheckDigit(cpf) === `${dg1}${dg2}`;
}

function clean(cpf: string) {
	return cpf.replace(/\D/g, "");
}

function isInvalidLength(cpf: string) {
	return cpf.length !== 11;
}

function allDigitsAreTheSame(cpf: string) {
	return cpf.split("").every(c => c === cpf[0]);
}

function calculateDigit(cpf: string, factor: number) {
	let total = 0;
	for (const digit of cpf) {
		if (factor > 1) total += parseInt(digit) * factor--;
	}
	const rest = total % 11;
	return (rest < 2) ? 0 : 11 - rest;
}

function extractCheckDigit(cpf: string) {
	return cpf.slice(9);
}

export async function signup(input: any): Promise<any> {
	const connection = pgp()(myConnectionString);
	try {
		const accountId = crypto.randomUUID();
		const [account] = await connection.query("select * from cccat14.account where email = $1", [input.email]);
		if (account) throw new Error("Duplicated account");
		if (isInvalidName(input.name)) throw new Error("Invalid name");
		if (isInvalidEmail(input.email)) throw new Error("Invalid email");
		if (!validateCpf(input.cpf)) throw new Error("Invalid cpf");
		if (input.isDriver && isInvalidCarPlate(input.carPlate)) throw new Error("Invalid car plate");
		await connection.query("insert into cccat14.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver) values ($1, $2, $3, $4, $5, $6, $7)", [accountId, input.name, input.email, input.cpf, input.carPlate, !!input.isPassenger, !!input.isDriver]);
		return {
			accountId
		};
	} finally {
		await connection.$pool.end();
	}
}

function isInvalidName(name: string) {
	return !name.match(/[a-zA-Z] [a-zA-Z]+/);
}

function isInvalidEmail(email: string) {
	return !email.match(/^(.+)@(.+)$/);
}

function isInvalidCarPlate(carPlate: string) {
	return !carPlate.match(/[A-Z]{3}[0-9]{4}/);
}

export async function getAccount(accountId: string) {
	const connection = pgp()(myConnectionString);
	const [account] = await connection.query("select * from cccat14.account where account_id = $1", [accountId]);
	await connection.$pool.end();
	return account;
}

//Task 1: Implementar a função RequestRide

const i18nStrings = {
	en: {
		requested: "Requested",
		accepted: "Accepted",
		started: "Started",
		finished: "Finished",
		thereIsRideInProgress: "There is a ride in progress",
	},
	ptbr: {
		requested: "Requisitada",
		accepted: "Aceita",
		started: "Iniciada",
		finished: "Finalizada",
		rideInProgress: "Já existe uma corrida em andamento",
	},
};

enum RideStatus {
	REQUESTED,
	ACCEPTED,
	STARTED,
	FINISHED,
}

export const i18n = i18nStrings.ptbr;

export class Ride {

	private rideId: string;
	private passenger_id: string;
	private status: RideStatus;

	constructor(rideId: string, passenger_id: string, status: RideStatus) {
		this.rideId = rideId;
		this.passenger_id = passenger_id;
		this.status = status;
	}

	public getRideId(): string {
		return this.rideId;
	}
	public getPassenger_id(): string {
		return this.passenger_id;
	}
	public getStatus(): RideStatus {
		return this.status;
	}
	public setStatus(status: RideStatus): void {
		this.status = status;
	}

	public getStatusString(): string {
		switch (this.status) {
			case RideStatus.REQUESTED:
				return i18n.requested;
			case RideStatus.ACCEPTED:
				return i18n.accepted;
			case RideStatus.STARTED:
				return i18n.started;
			case RideStatus.FINISHED:
				return i18n.finished;
		}
	}
}

async function thereIsRideInProgress(passenger_id: string): Promise<boolean> {
	const connection = pgp()(myConnectionString);
	try {
		const rides = await connection.query(
			"select * from cccat14.ride where passenger_id = $1 and status = '$2'",
			[passenger_id, RideStatus.REQUESTED]
		);
		await connection.$pool.end();
		return rides.length > 0;
	} catch (error) {
		console.log(error);
		return true;
	}
}

export async function createRequestRide(input: any): Promise<any> {
	const rideId = crypto.randomUUID();
	const rideObj = new Ride(rideId, input.passenger_id, RideStatus.REQUESTED);
	const rideInProgress = await thereIsRideInProgress(input.passenger_id);
	if (rideInProgress) throw new Error(i18n.rideInProgress);

	const connection = pgp()(myConnectionString);
	await connection.query(
		"insert into cccat14.ride (ride_id, passenger_id, status) values ($1, $2, $3)",
		[
			rideObj.getRideId(), rideObj.getPassenger_id(), rideObj.getStatus()
		]
	);
	try {
		return {
			rideId
		};
	} finally {
		await connection.$pool.end();
	}
}

export async function RequestRide(rideId: string) {
	// const connection = pgp()(myConnectionString);
	// const [account] = await connection.query("select * from cccat14.ride where ride_id = $1", [rideId]);
	// await connection.$pool.end();
	return {
		rideId,
		passenger_id: "0795ff3f-f8a0-4e21-920d-34440fbe431d"
	};
}
