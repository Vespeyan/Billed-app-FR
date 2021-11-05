import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import firebase from "../__mocks__/firebase.js"
import firestore from "../app/Firestore"
import { localStorageMock } from "../__mocks__/localStorage.js"
import userEvent from "@testing-library/user-event"
import Router from "../app/Router.js"

describe("Given I am connected as an employee", () => {
  // On vérifie que la page voulue soit bien affichée
  describe("When I am on NewBill Page", () => {
    test("Then the newBill form is displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      // On s'attend à ce que le texte "Envoyer une note de frais" soit bien affiché, celui-ci correspondant à la page qui nous intéresse
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
  // On vérifie que l'icône correspondant à la page new bill soit bien en surbrillance
  describe("When I am on NewBill Page", () => {
    test("Then NewBill icon in vertical layout should be highlighted", () => {
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH["NewBill"] } })
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = '<div id="root"></div>';
      firestore.bills = () => firebase
      Router()
      // On s'attend à ce que l'icône ait la classe "active-icon" signifiant qu'il est bien en surbrillance
      expect(screen.getByTestId('icon-mail').classList.contains("active-icon")).toBeTruthy();
    })
  })
  // On vérifie que quand on uploade un fichier valide, celui-ci soit bien uploadé
  describe("When I try to upload an valid file", () => {
    test("Then the file is uploaded", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const fileInput = screen.getByTestId("file");
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({
        document, onNavigate, firestore: null, localStorage: window.localStorage 
      })
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["image.png"], "image.png", { type: "image/png" })],
        },
      });
      // On s'attend à ce que la fonction gérant l'upload ait bien été lancée
      expect(handleChangeFile).toHaveBeenCalled();
      // On s'attend à ce que le nom du fichier uploadée (s'il y en a un) corresponde bien à celui qu'on a uploadé
      expect(fileInput.files[0].name).toBe("image.png")
      // On s'attend à ne pas avoir reçu un message d'erreur
      expect(screen.getByTestId("error-message-test").textContent).not.toBe("Veuillez choisir une image au format png, jpg, ou jpeg")
    })
  })
  // On vérifie que quand on uploade un fichier invalide, un message d'erreur nous soit bien renvoyé
  describe("When I try to upload an invalid file", () => {
    test("Then I get an error message", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const fileInput = screen.getByTestId("file");
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({
        document, onNavigate, firestore: null, localStorage: window.localStorage 
      })
      let testFile = new File(["notAnImage.txt"], "notAnImage.txt", {type: "text/txt" })
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);
      userEvent.upload(fileInput, testFile);
      // On s'attend à ce que la fonction gérant l'upload ait bien été lancée
      expect(handleChangeFile).toHaveBeenCalled();
      // On s'attend à avoir reçu un message d'erreur
      expect(screen.getByTestId("error-message-test").textContent).toBe("Veuillez choisir une image au format png, jpg, ou jpeg")
    })
  })
  // On vérifie que quand on soumet le formulaire avec tous les champs requis remplis, celui-ci soit bien soumis
  describe("When I try to submit the form with all the required input correctly filled", () => {
    test("Then the form is submitted", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = ((pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      })
      const validBill = {
        type: "Transports",
        name: "Vol Paris Londres",
        date: "2021-10-29",
        amount: "348",
        vat: "70",
        pct: "20",
        fileName: "image.png"
      }
      const billToSubmit = new NewBill({
        document, onNavigate, firestore: firestore, localStorage: window.localStorage
      })
      const handleSubmit = jest.fn((e) => billToSubmit.handleSubmit(e))
      billToSubmit.createBill = (billToSubmit) => billToSubmit

      screen.getByTestId("expense-type").value = validBill.type
      screen.getByTestId("expense-name").value = validBill.name
      screen.getByTestId("datepicker").value = validBill.date
      screen.getByTestId("amount").value = validBill.amount
      screen.getByTestId("vat").value = validBill.vat
      screen.getByTestId("pct").value = validBill.pct
      billToSubmit.fileName = validBill.fileName

      const formNewBill = screen.getByTestId("form-new-bill")
      formNewBill.addEventListener("click", handleSubmit)
      fireEvent.click(formNewBill)
      // On s'attend à ce que la fonction gérant la soumission du formulait ait bien été appelée
      expect(handleSubmit).toBeCalled()
      // On s'attend à ce que le texte "Mes notes de frais" soit affiché, ce qui veut dire qu'on est bien revenus sur la page principale
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy()

      }
    )
  })
  // POST
  // Ici j'ai réutilisé la fonction GET de Bills.js en créant une méthode POST dans le fichier firebase.js que j'ai utilisée à la place de la méthode GET
  describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to New Bill", () => {
      test("Post a new bill", async () => {
         const postSpy = jest.spyOn(firebase, "post")
         const bills = await firebase.post(NewBill)
         expect(postSpy).toHaveBeenCalledTimes(1)
         expect(bills.data.length).toBe(1)
      })
      test("Post a new bill and fails with 404 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        )
        const html = BillsUI({ error: "Erreur 404" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("Post a new bill and fails with 500 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        )
        const html = BillsUI({ error: "Erreur 500" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})