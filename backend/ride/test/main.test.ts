import {
	getAccount,
	signup,
	createRequestRide,
	RequestRide,
	i18n
} from "../src/main";
import crypto from "crypto";

test.each([
	"97456321558",
	"71428793860",
	"87748248800"
])("Deve criar uma conta para o passageiro", async function (cpf: string) {
	// given
	const inputSignup = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf,
		isPassenger: true,
		password: "123456"
	};
	// when
	const outputSignup = await signup(inputSignup);
	const outputGetAccount = await getAccount(outputSignup.accountId);
	// then
	expect(outputSignup.accountId).toBeDefined();
	expect(outputGetAccount.name).toBe(inputSignup.name);
	expect(outputGetAccount.email).toBe(inputSignup.email);
});

test("Não deve criar uma conta se o nome for inválido", async function () {
	// given
	const inputSignup = {
		name: "John",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "97456321558",
		isPassenger: true,
		password: "123456"
	};
	// when
	await expect(() => signup(inputSignup)).rejects.toThrow(new Error("Invalid name"));
});

test("Não deve criar uma conta se o email for inválido", async function () {
	// given
	const inputSignup = {
		name: "John Doe",
		email: `john.doe${Math.random()}`,
		cpf: "97456321558",
		isPassenger: true,
		password: "123456"
	};
	// when
	await expect(() => signup(inputSignup)).rejects.toThrow(new Error("Invalid email"));
});

test.each([
	"",
	undefined,
	null,
	"11111111111",
	"111",
	"11111111111111"
])("Não deve criar uma conta se o cpf for inválido", async function (cpf: any) {
	// given
	const inputSignup = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf,
		isPassenger: true,
		password: "123456"
	};
	// when
	await expect(() => signup(inputSignup)).rejects.toThrow(new Error("Invalid cpf"));
});

test("Não deve criar uma conta se o email for duplicado", async function () {
	// given
	const inputSignup = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "97456321558",
		isPassenger: true,
		password: "123456"
	};
	// when
	await signup(inputSignup);
	await expect(() => signup(inputSignup)).rejects.toThrow(new Error("Duplicated account"));
});

test("Deve criar uma conta para o motorista", async function () {
	// given
	const inputSignup = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "97456321558",
		carPlate: "AAA9999",
		isPassenger: false,
		isDriver: true,
		password: "123456"
	};
	// when
	const outputSignup = await signup(inputSignup);
	const outputGetAccount = await getAccount(outputSignup.accountId);
	// then
	expect(outputSignup.accountId).toBeDefined();
	expect(outputGetAccount.name).toBe(inputSignup.name);
	expect(outputGetAccount.email).toBe(inputSignup.email);
});

test("Não deve criar uma conta para o motorista com a placa inválida", async function () {
	// given
	const inputSignup = {
		name: "John Doe",
		email: `john.doe${Math.random()}@gmail.com`,
		cpf: "97456321558",
		carPlate: "AAA999",
		isPassenger: false,
		isDriver: true,
		password: "123456"
	};
	// when
	await expect(() => signup(inputSignup)).rejects.toThrow(
		new Error("Invalid car plate")
	);
});

test("Deve solicitar uma corrida", async function () {
	// given
	const inputRequestRide = {
		passenger_id: crypto.randomUUID(),
		latitude: -23.563099,
		longitude: -46.656571
	};
	// when
	const outputCreateRequestRide = await createRequestRide(inputRequestRide);
	const outputRequestRide = await RequestRide(outputCreateRequestRide.rideId);
	// then
	expect(outputCreateRequestRide.rideId).toBeDefined();
});

test("Não deve solicitar uma corrida", async function () {
	// given
	const inputRequestRide = {
		passenger_id: "0795ff3f-f8a0-4e21-920d-34440fbe431d",
		latitude: -23.563099,
		longitude: -46.656571
	};
	// when
	await expect(() => createRequestRide(inputRequestRide)).rejects.toThrow(
		new Error(i18n.rideInProgress)
	);
});