import { screen } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bill from "../containers/Bills.js"
import firebase from "../__mocks__/firebase"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import userEvent from "@testing-library/user-event"
import Router from "../app/Router.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import firestore from "../app/Firestore"


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH["Bills"] } })
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = '<div id="root"></div>';
      firestore.bills = () => firebase
      Router()
      expect(screen.getByTestId('icon-window').classList.contains("active-icon")).toBeTruthy();
    })
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})
// On vérifie que le message de chargement de la page est bien affiché quand on est en train de se connecter
  describe("When Bills page is loading", () => {
    test("Then the loading message should be displayed", () => {
      // loading : true = la page est en train de charger
      const html = BillsUI({ data: bills, loading: true })
      document.body.innerHTML = html;
      const loadingMessage = screen.getByTestId("loading")
      // On s'attend à ce que le message de chargement apparaisse bien
      expect(loadingMessage).toBeTruthy()
    })
  })
  // On vérifie que le message d'erreur s'affiche en cas d'échec du chargement de la page
  describe("When Bills page loading failed", () => {
    test("Then the error message should be displayed", () => {
      // error : true = échec du chargement de la page
      const html = BillsUI({data: bills, error: true })
      document.body.innerHTML = html;
      const errorMessage = screen.getByTestId("error-message")
      // On s'attend à ce que le message d'erreur apparaisse
      expect(errorMessage).toBeTruthy()
    })
  })
  // On vérifie que lorsqu'on clique sur le bouton pour générer une nouvelle note de frais, la page correspondante s'ouvre bien
  describe("When I click on the new bill button", () => {
    test("Then the new bill page should be opened", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const bill = new Bill({
        document, onNavigate, firestore: null, localStorage: window.localStorage
      })
      const handleClickNewBill = jest.fn(Bill.handleClickNewBill)
      const newBillButton = screen.getByTestId("btn-new-bill")
      newBillButton.addEventListener("click", handleClickNewBill)
      userEvent.click(newBillButton)
      // On s'attend à ce que la fonction qui gère le bouton new bill soit appelée
      expect(handleClickNewBill).toHaveBeenCalled()
      // On s'attend à ce que la chaine de texte "Envoyer une note" de frais apparaisse bien à l'écran (ce message n'apparait que sur la page de nouvelle note de frais)
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
  // On vérifie que lorsqu'on clique sur un icône oeil, la preuve s'ouvre bien dans une modale 
  describe("When I click on one of the eye icons", () => {
    test("Then A modal should be opened, displaying a proof", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const bill = new Bill({
        document, onNavigate, firestore: null, localStorage: window.localStorage
    })
    $.fn.modal = jest.fn();
    const eye = screen.getAllByTestId("icon-eye")[0]
    const handleClickIconEye = jest.fn(bill.handleClickIconEye(eye))
    eye.addEventListener("click", handleClickIconEye)
    userEvent.click(eye)
    // On s'attend à ce que la fonction qui gère l'ouverture de la modale quand on clique sur l'oeil soit appelée
    expect(handleClickIconEye).toHaveBeenCalled()
    const modale = screen.getByText("Justificatif")
    // On s'attend à ce que la modale soit apparue
    expect(modale).toBeTruthy()
  })
  })
  
  // test d'intégration GET
  /*
  Ici on a juste copié le test d'intégration GET du fichier Dashboard.js en changeant const html = DashboardUI 
  par const html = BillsUI pour charger la page qui nous intéresse à la place
  */
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
       const getSpy = jest.spyOn(firebase, "get")
       const bills = await firebase.get()
       expect(getSpy).toHaveBeenCalledTimes(1)
       expect(bills.data.length).toBe(4)
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})