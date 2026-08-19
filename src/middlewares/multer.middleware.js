import multer from "multer"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },//cb is a function that you call to tell Multer what to do next.
  filename: function (req, file, cb) {

    cb(null, file.originalname)
  }
})

export const upload = multer({
 storage,
})

/*this is your Multer configuration. 
It tells Multer where to temporarily store uploaded files and what to name them.*/