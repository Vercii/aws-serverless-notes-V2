## **README.md**
# Serverless Notes

A **serverless note-taking web application** using AWS services. This project demonstrates a full serverless stack:

- **Frontend:** HTML, CSS, and JavaScript  
- **Backend:** AWS Lambda functions  
- **API Layer:** AWS API Gateway  
- **Database:** DynamoDB  
- **Hosting:** AWS Amplify

## **Live Demo**

You can view the live app here:  
[Serverless Notes Live](https://main.d3i1c30pbgufzf.amplifyapp.com/)

## **Features**

- You may create your own account and have it authenticated
- Add, view, and delete notes
- Serverless architecture (scales automatically)
- Frontend hosted via AWS Amplify
- Backend connected to DynamoDB
- Fully responsive and clean UI
---

## Architecture Decisions

This project follows a serverless architecture to maximize scalability, simplicity, and cost-efficiency.

### AWS Lambda vs EC2

AWS Lambda was chosen to handle backend logic because it eliminates the need for server management and scales automatically. Since this application consists of lightweight API endpoints, using EC2 would introduce unnecessary overhead and cost.

### Amplify vs S3 + CloudFront

AWS Amplify was used for frontend hosting due to its built-in CI/CD pipeline, automatic deployments, and simplified configuration. While S3 and CloudFront could achieve similar results, Amplify significantly reduces setup complexity and improves developer experience.

### DynamoDB vs RDS

Amazon DynamoDB was selected because the application uses a simple access pattern (user → notes). DynamoDB’s serverless nature and high scalability make it ideal for this use case, whereas RDS would be better suited for applications requiring complex relational queries.
